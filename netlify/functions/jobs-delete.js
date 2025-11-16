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
