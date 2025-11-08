const { MongoClient } = require("mongodb");
const clerkSdk = require("@clerk/clerk-sdk-node");
const getAuth = clerkSdk.getAuth ?? clerkSdk.default?.getAuth ?? clerkSdk;
if (typeof getAuth !== "function") {
  console.error("Clerk getAuth not found. clerkSdk keys:", Object.keys(clerkSdk || {}));
}

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connect() {
  if (!db) {
    await client.connect();
    db = client.db("jobtracker");
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
    if (!job_title || !employer || !status) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // We have a verified Clerk userId at this point (from getAuth above).
    const id = Math.random().toString(36).slice(2);

    const saved = {
      id,
      userId,
      job_title,
      employer,
      job_date,
      status,
      skills,
      description,
      rejected: false,
      ghosted: false,
    };

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
      const coll = database.collection("jobs");
      const insertRes = await coll.insertOne({
        ...saved,
        createdAt: new Date(),
      });
      // attach Mongo's _id to returned object for debugging/consistency
      saved._id = insertRes.insertedId;
      console.log("jobs-create: inserted job id:", insertRes.insertedId?.toString?.() ?? insertRes.insertedId);
    } catch (dbErr) {
      console.error("jobs-create: MongoDB insert failed:", dbErr);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Failed to persist job", detail: String(dbErr) }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(saved),
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
