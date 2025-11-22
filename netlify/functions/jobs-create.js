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
    if (!userId && token && token.split(".").length >= 2) {
      try {
        const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf8"));
        const candidate = claims.sub || claims.user_id || claims.userId || claims.uid;
        if (candidate) {
          userId = candidate;
          console.log("jobs-create userId extracted from token (UNVERIFIED):", userId);
        }
      } catch (jwtErr) {
        console.warn("jobs-create JWT decoding failed", jwtErr);
      }
    }

    // At this point, we should have a userId from Clerk or from the token.
    // If no userId can be determined, reject the request.
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    const { job_title, employer, job_date, status, work_mode, location, notes } = payload || {};

    // Basic validation
    if (!job_title || !employer || !job_date || !status || !work_mode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // Create a new job application document
    const newDoc = {
      userid: userId,
      job_title,
      employer,
      job_date: new Date(job_date),
      status,
      work_mode,
      location: location || undefined,
      notes: notes || undefined,
      rejected: false,
      ghosted: false,
      createdAt: new Date(),
    };

    // Insert the new document into the "jobs" collection
    let result;
    try {
      const db = await connect();
      result = await db.collection("jobs").insertOne(newDoc);
      console.log("jobs-create: inserted document into MongoDB:", result.insertedId);
    } catch (dbErr) {
      console.error("jobs-create: MongoDB insertOne() failed:", dbErr);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Internal Server Error" }),
      };
    }

    // Successful response
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ id: result.insertedId, ...newDoc }),
    };
  } catch (err) {
    console.error("jobs-create handler error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
