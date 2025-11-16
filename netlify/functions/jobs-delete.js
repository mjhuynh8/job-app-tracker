const { MongoClient, ObjectId } = require("mongodb");
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
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: "" };

  let payload = null;
  try { payload = event.body ? JSON.parse(event.body) : {}; } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  try {
    const reqHeaders = event.headers || {};
    let userId = null;
    try {
      const authInfo = typeof getAuth === "function" ? getAuth({ headers: reqHeaders }) : null;
      if (authInfo && authInfo.userId) userId = authInfo.userId;
    } catch (e) { console.warn("jobs-delete getAuth failed", e); }

    // fallback: try bearer token / cookie decode or body.token (UNVERIFIED) as last resort
    let token = "";
    const authHeader = reqHeaders.Authorization || reqHeaders.authorization || "";
    if (authHeader && authHeader.startsWith("Bearer ")) token = authHeader.slice(7).trim();
    if (!token && payload && typeof payload.token === "string") token = payload.token.trim();
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
    if (!userId && token) {
      try {
        const parts = token.split(".");
        if (parts.length >= 2) {
          const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          const decoded = Buffer.from(b64, "base64").toString("utf8");
          const claims = JSON.parse(decoded);
          userId = claims.sub || claims.user_id || claims.userId || claims.uid || null;
          console.warn("jobs-delete: using UNVERIFIED token payload fallback for userId");
        }
      } catch (e) {
        console.warn("jobs-delete token decode failed", e);
      }
    }

    if (!userId) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const { id } = payload || {};
    if (!id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing id" }) };
    }

    const database = await connect();
    const coll = database.collection("jobs");
    const _id = ObjectId.isValid(id) ? new ObjectId(id) : id;
    const res = await coll.deleteOne({ _id, userid: String(userId) });
    if (res.deletedCount === 0) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found or not authorized" }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("jobs-delete error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Internal Server Error" }) };
  }
};
