const { MongoClient } = require("mongodb");
const clerkSdk = require("@clerk/clerk-sdk-node");
const getAuth = clerkSdk.getAuth ?? clerkSdk.default?.getAuth ?? clerkSdk;
if (typeof getAuth !== "function") {
  console.error("Clerk getAuth not found. clerkSdk keys:", Object.keys(clerkSdk || {}));
}

// Use short server selection/connect timeouts so the function fails fast instead of hanging.
// Adjust numbers if you need a longer window, but keep them small for serverless.
const client = new MongoClient(process.env.MONGODB_URI, {
  // how long to wait to find a suitable server (ms)
  serverSelectionTimeoutMS: 5000,
  // how long to wait for socket inactivity (ms)
  socketTimeoutMS: 45000,
  // how long to wait for initial TCP connection (ms)
  connectTimeoutMS: 5000,
});
let db;

async function connect() {
  if (!db) {
    try {
      await client.connect();
      // Respect explicit DB env var or default to "jobtracker"
      const dbName = process.env.MONGODB_DB_NAME || "jobtracker";
      db = client.db(dbName);
      console.log("jobs-create: connected to MongoDB, using database:", db.databaseName);
      // defensive: if somehow we landed in "local", switch to intended DB
      if (db.databaseName === "local") {
        console.warn("jobs-create: connected DB is 'local' — forcing configured DB name:", dbName);
        db = client.db(dbName);
      }
    } catch (connectErr) {
      console.error("jobs-create: MongoDB connect() failed:", connectErr);
      // Re-throw to be handled by the caller so we return a helpful response
      throw connectErr;
    }
  }
  return db;
}

exports.handler = async function (event, context) {
  // Basic CORS handling for browser requests from your frontend
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Respond to preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: "",
    };
  }

  // Only accept POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    // Log incoming header keys and a hint whether Authorization was present (do NOT log the token)
    try {
      const hdrObj = event.headers || {};
      const hdrKeys = Object.keys(hdrObj).slice(0, 200);
      const hasAuthHeader = !!(hdrObj.Authorization || hdrObj.authorization);
      console.log("jobs-create request header keys:", hdrKeys);
      console.log("jobs-create has Authorization header:", hasAuthHeader);

      if (typeof hdrObj.cookie === "string" && hdrObj.cookie.trim()) {
        const cookieNames = hdrObj.cookie
          .split(";")
          .map((c) => c.split("=")[0]?.trim())
          .filter(Boolean);
        console.log("jobs-create cookie names:", cookieNames.slice(0, 50));
      }
    } catch (logErr) {
      console.warn("jobs-create header logging failed", logErr);
    }

    // Prefer Authorization header but fall back to token in JSON body (helpful if a proxy strips headers)
    const reqHeaders = event.headers || {};
    const authHeader = reqHeaders.Authorization || reqHeaders.authorization || "";
    let token = "";
    if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice("Bearer ".length).trim();
    }

    // Parse body (safe)
    let payload = null;
    try {
      payload = event.body ? JSON.parse(event.body) : null;
    } catch (e) {
      console.warn("jobs-create invalid JSON body:", e);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid JSON body" }),
      };
    }

    // fallback token from body.token if header absent
    if (!token && payload && typeof payload.token === "string") {
      token = payload.token.trim();
      // remove token from stored payload to avoid persisting sensitive token
      delete payload.token;
      console.log("jobs-create token supplied in body (used as fallback)");
    }

    // fallback: try to extract token from cookie header (don't log cookie values)
    if (!token && typeof reqHeaders.cookie === "string") {
      try {
        const cookiePairs = reqHeaders.cookie.split(";").map((s) => s.trim()).filter(Boolean);
        const cookieObj = {};
        cookiePairs.forEach((pair) => {
          const idx = pair.indexOf("=");
          if (idx > -1) {
            const k = pair.slice(0, idx).trim();
            const v = pair.slice(idx + 1);
            cookieObj[k] = v;
          }
        });
        const cookieCandidates = ["__session", "session", "clerk_session", "clerk_token", "session_token", "token", "jwt"];
        for (const cname of cookieCandidates) {
          if (cookieObj[cname]) {
            token = cookieObj[cname];
            break;
          }
        }
        if (token) {
          console.log("jobs-create token extracted from cookie header (value not logged)");
        }
      } catch (cookieErr) {
        console.warn("jobs-create cookie parsing failed", cookieErr);
      }
    }

    // Use Clerk server helper to validate and extract authenticated user information
    let userId = null;
    try {
      // Pass both headers and cookies to getAuth (some runtimes expect cookie separately)
      const getAuthArg = { headers: reqHeaders, cookies: reqHeaders.cookie ? reqHeaders.cookie : undefined };
      const authInfo = typeof getAuth === "function" ? getAuth(getAuthArg) : null;
      console.log("jobs-create getAuth keys:", authInfo ? Object.keys(authInfo) : null);
      if (authInfo && authInfo.userId) {
        userId = authInfo.userId;
      }
    } catch (getAuthErr) {
      console.warn("jobs-create getAuth() failed:", getAuthErr);
    }

    // If getAuth didn't give us a userId, but we received a Bearer token, attempt a
    // non-verified decode of the JWT payload to extract a candidate user id.
    // WARNING: This is an UNVERIFIED fallback for convenience/debugging only.
    // Do NOT rely on this for production-level auth — configure CLERK_SECRET_KEY
    // in Netlify environment and prefer getAuth.
    if (!userId && token) {
      try {
        const parts = token.split(".");
        if (parts.length >= 2) {
          // base64url -> base64
          const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          const decoded = Buffer.from(b64, "base64").toString("utf8");
          const claims = JSON.parse(decoded);
          const candidate = claims.sub || claims.user_id || claims.userId || claims.uid || null;
          if (candidate) {
            userId = String(candidate);
            console.warn("jobs-create: using UNVERIFIED token payload fallback for userId. Configure CLERK_SECRET_KEY in Netlify to enable server-side verification.");
          }
        }
      } catch (decodeErr) {
        console.warn("jobs-create JWT decode fallback failed (non-fatal):", decodeErr);
      }
    }

    // If we still don't have a userId, return 401 and an actionable hint.
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: "Unauthorized",
          hint:
            "No valid Clerk session found. Ensure the Authorization: Bearer <token> header reaches this function and that your Clerk server key (e.g. CLERK_SECRET_KEY / CLERK_API_KEY) is configured in Netlify environment variables. As a temporary measure this function can decode the token payload client-side as a fallback, but server-side verification requires the Clerk secret key in env.",
        }),
      };
    }

    // Basic validation of required fields that your client sends
    const { job_title, employer, job_date, status, skills, description } = payload || {};
    // required per collection validator: userid, job_title, employer, job_date, status
    if (!job_title || !employer || !status || !job_date) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields (job_title, employer, job_date, status required)" }),
      };
    }
    // enforce allowed status values server-side
    const allowedStatuses = ["Pre-interview", "Interview", "Offer"];
    if (!allowedStatuses.includes(status)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid status", allowed: allowedStatuses }),
      };
    }
    // parse job_date into a Date (validator expects BSON date)
    let parsedJobDate;
    try {
      parsedJobDate = new Date(job_date);
      if (isNaN(parsedJobDate.getTime())) {
        throw new Error("invalid date");
      }
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid job_date; expected an ISO date string" }),
      };
    }

    // Prepare a document for insertion that matches expected BSON types.
    // Do NOT include a custom `id` field here (some validators disallow it).
    // Convert job_date to a real Date object when possible.
    const docToInsert = {
      // use the exact field name your validator requires
      userid: String(userId),
      // keep other optional compat fields if you like (not required)
      userId: String(userId),
      job_title: String(job_title),
      employer: String(employer),
      status: String(status),
      skills: typeof skills === "string" ? skills : "",
      description: typeof description === "string" ? description : "",
      rejected: false,
      ghosted: false,
      createdAt: new Date(),
    };

    // we already parsed and validated job_date above
    docToInsert.job_date = parsedJobDate;

    // Persist to MongoDB if MONGODB_URI is configured.
    // If you are running on Netlify make sure MONGODB_URI is set in Site > Build & deploy > Environment.
    try {
      if (!process.env.MONGODB_URI) {
        console.warn("jobs-create: MONGODB_URI not set; skipping DB persist");
        // Return 500 so this is loud in production; adjust if you'd prefer to accept without DB.
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: "Server misconfiguration",
            hint: "MONGODB_URI is not configured in environment variables.",
          }),
        };
      }

      const database = await connect();
      // Log what database/collection we will write to (helps diagnose 'local.oplog.rs' issues)
      console.log("jobs-create: database before insert:", database.databaseName);
      const coll = database.collection("jobs");
      console.log("jobs-create: target collection namespace:", `${database.databaseName}.${coll.collectionName}`);
      const insertRes = await coll.insertOne(docToInsert);
      // Build the saved object to return to the client (includes insertedId)
      const saved = {
        id: insertRes.insertedId?.toString?.() ?? String(insertRes.insertedId),
        _id: insertRes.insertedId,
        userid: docToInsert.userid,
        userId: docToInsert.userId,
        job_title: docToInsert.job_title,
        employer: docToInsert.employer,
        job_date: docToInsert.job_date.toISOString(),
        status: docToInsert.status,
        skills: docToInsert.skills,
        description: docToInsert.description,
        rejected: docToInsert.rejected,
        ghosted: docToInsert.ghosted,
        createdAt: docToInsert.createdAt.toISOString(),
      };
      console.log("jobs-create: inserted job id:", saved.id, "namespace:", `${database.databaseName}.${coll.collectionName}`);
    } catch (dbErr) {
      console.error("jobs-create: MongoDB operation failed:", dbErr);
      // If connect() timed out or server selection failed, surface a 502 with actionable hint.
      const msg = String(dbErr || "");
      if (msg.includes("timed out") || msg.includes("failed to connect") || dbErr.name === "MongoServerSelectionError") {
        return {
          statusCode: 502,
          headers,
          body: JSON.stringify({
            error: "Bad Gateway",
            hint:
              "Unable to reach MongoDB within the configured timeout. Check MONGODB_URI, Atlas/network IP access, and that your DB allows connections from Netlify.",
            detail: String(dbErr.message || dbErr),
          }),
        };
      }

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Failed to persist job", detail: String(dbErr) }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(
        // return the saved record we built after insert
        (typeof saved !== "undefined" && saved) || {
          // fallback: include docToInsert if something unexpected happened
          ...docToInsert,
          id: undefined,
        }
      ),
    };
  } catch (err) {
    console.error("jobs-create error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
