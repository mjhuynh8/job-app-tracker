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

function extractTokenAndUserId(headers, bodyToken) {
  let token = "";
  const auth = headers.Authorization || headers.authorization || "";
  if (auth.startsWith("Bearer ")) token = auth.slice(7).trim();
  if (!token && bodyToken) token = bodyToken.trim();
  if (!token && headers.cookie) {
    headers.cookie.split(";").map(s => s.trim()).forEach(p => {
      const [k, v] = p.split("=");
      if (!token && v && /session|token|jwt|clerk/i.test(k)) token = v;
    });
  }
  let userId = null;
  try {
    const authInfo = typeof getAuth === "function" ? getAuth({ headers }) : null;
    if (authInfo?.userId) userId = authInfo.userId;
  } catch {}
  if (!userId && token && token.split(".").length >= 2) {
    try {
      const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf8"));
      userId = claims.sub || claims.user_id || claims.userId || claims.uid || null;
    } catch {}
  }
  return { token, userId };
}

function normalizeLocation(input) {
  if (!input) return undefined;
  const s = String(input).trim();
  if (!s) return undefined;
  if (/^washington\s*,?\s*dc$/i.test(s)) return "Washington, DC, United States";
  const parts = s.split(",").map(p => p.trim()).filter(Boolean);
  const [city = "", stateRaw = "", countryRaw = ""] = parts;
  const state = stateRaw && stateRaw.length <= 3 ? stateRaw.toUpperCase() : stateRaw;
  const country = countryRaw || "United States";
  return [city, state, country].filter(Boolean).join(", ");
}

function isValidLocationInput(input) {
  if (input === undefined || input === null) return true;
  const s = String(input).trim();
  if (!s) return false;
  if (/^washington\s*,?\s*dc$/i.test(s)) return true;
  return s.split(",").map(p => p.trim()).filter(Boolean).length >= 2;
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
    const { token, userId } = extractTokenAndUserId(reqHeaders, payload?.token);

    if (!userId) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const { id, patch } = payload || {};
    if (!id || !patch) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing id or patch" }) };
    }

    const database = await connect();
    const coll = database.collection("jobs");
    const _id = ObjectId.isValid(id) ? new ObjectId(id) : id;
    // Ensure user owns the document
    const filter = { _id, userid: String(userId) };
    const update = { $set: {} };

    for (const k of Object.keys(patch)) {
      if (k === "job_date") update.$set.job_date = new Date(patch.job_date);
      else if (k === "location") {
        if (!isValidLocationInput(patch.location))
          return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid location format" }) };
        update.$set.location = normalizeLocation(patch.location);
      } else if (k === "work_mode") {
        if (!["In-person", "Hybrid", "Remote"].includes(patch.work_mode))
          return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid work_mode" }) };
        update.$set.work_mode = patch.work_mode;
      } else if (k === "status") {
        if (!["Pre-interview","Interview","Offer"].includes(patch.status))
          return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid status" }) };
        update.$set.status = patch.status;
      } else if (k === "ghosted" || k === "rejected") update.$set[k] = !!patch[k];
      else if (k === "notes") update.$set.notes = patch.notes || undefined;
      else update.$set[k] = patch[k];
    }

    const res = await coll.findOneAndUpdate(filter, update, { returnDocument: "after" });
    if (!res.value) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found or not authorized" }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify(res.value) };
  } catch (err) {
    console.error("jobs-update error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Internal Server Error" }) };
  }
};
