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

function extractUserId(headers) {
  let userId = null;
  try {
    const authInfo = typeof getAuth === "function" ? getAuth({ headers }) : null;
    if (authInfo?.userId) return authInfo.userId;
  } catch {}
  let token = "";
  const a = headers.Authorization || headers.authorization || "";
  if (a.startsWith("Bearer ")) token = a.slice(7).trim();
  if (!token && headers.cookie) {
    headers.cookie.split(";").forEach((p) => {
      const [k, v] = p.split("=");
      if (!token && v && /session|token|jwt|clerk/i.test(k)) token = v;
    });
  }
  if (token && token.split(".").length >= 2) {
    try {
      const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf8"));
      userId = claims.sub || claims.user_id || claims.userId || claims.uid || null;
    } catch {}
  }
  return userId;
}

exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const reqHeaders = event.headers || {};
    const userId = extractUserId(reqHeaders);
    if (!userId) return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };

    const database = await connect();
    const coll = database.collection("jobs");
    const docs = await coll.find({ userid: userId }).sort({ createdAt: 1 }).toArray();
    return { statusCode: 200, headers, body: JSON.stringify(docs) };
  } catch (err) {
    console.error("jobs-list error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Internal Server Error" }) };
  }
};
