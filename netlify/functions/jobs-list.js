const { MongoClient } = require("mongodb");
const clerkSdk = require("@clerk/clerk-sdk-node");
const getAuth = clerkSdk.getAuth ?? clerkSdk.default?.getAuth ?? clerkSdk;
const client = new MongoClient(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
});
let db;

async function connect() {
  if (!db) {
    await client.connect();
    const dbName = process.env.MONGODB_DB_NAME || "jobtracker";
    db = client.db(dbName);
  }
  return db;
}

exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const reqHeaders = event.headers || {};
    // try Clerk getAuth first
    let userId = null;
    try {
      const authInfo = typeof getAuth === "function" ? getAuth({ headers: reqHeaders }) : null;
      if (authInfo && authInfo.userId) userId = authInfo.userId;
    } catch (e) {
      console.warn("jobs-list getAuth failed", e);
    }

    // fallback: try bearer token / cookie decode (UNVERIFIED) as last resort
    if (!userId) {
      const authHeader = reqHeaders.Authorization || reqHeaders.authorization || "";
      let token = "";
      if (authHeader && authHeader.startsWith("Bearer ")) token = authHeader.slice(7).trim();
      if (!token && typeof reqHeaders.cookie === "string") {
        try {
          const pairs = reqHeaders.cookie.split(";").map((s) => s.trim());
          for (const p of pairs) {
            const [k, v] = p.split("=");
            if (["__session", "session", "token", "jwt", "clerk_session"].includes(k) && v) {
              token = v;
              break;
            }
          }
        } catch {}
      }
      if (token) {
        try {
          const parts = token.split(".");
          if (parts.length >= 2) {
            const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
            const decoded = Buffer.from(b64, "base64").toString("utf8");
            const claims = JSON.parse(decoded);
            userId = claims.sub || claims.user_id || claims.userId || claims.uid || null;
            console.warn("jobs-list: using UNVERIFIED token payload fallback for userId");
          }
        } catch (e) {
          console.warn("jobs-list token decode failed", e);
        }
      }
    }

    if (!userId) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const database = await connect();
    const coll = database.collection("jobs");
    const docs = await coll.find({ userid: userId }).sort({ createdAt: 1 }).toArray();
    return { statusCode: 200, headers, body: JSON.stringify(docs) };
  } catch (err) {
    console.error("jobs-list error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Internal Server Error" }) };
  }
};
