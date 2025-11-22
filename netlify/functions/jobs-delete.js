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

function extractUserId(headers, bodyToken) {
  let token = "";
  const a = headers.Authorization || headers.authorization || "";
  if (a.startsWith("Bearer ")) token = a.slice(7).trim();
  if (!token && bodyToken) token = bodyToken.trim();
  if (!token && headers.cookie) {
    headers.cookie.split(";").forEach((p) => {
      const [k, v] = p.split("=");
      if (!token && v && /session|token|jwt|clerk/i.test(k)) token = v;
    });
  }
  try {
    const authInfo = typeof getAuth === "function" ? getAuth({ headers }) : null;
    if (authInfo?.userId) return authInfo.userId;
  } catch {}
  if (token && token.split(".").length >= 2) {
    try {
      const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf8"));
      return claims.sub || claims.user_id || claims.userId || claims.uid || null;
    } catch {}
  }
  return null;
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
    const userId = extractUserId(reqHeaders, payload?.token);
    if (!userId) return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };

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
