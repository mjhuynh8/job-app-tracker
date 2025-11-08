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
    // Expect Authorization: Bearer <token>
    const auth = (event.headers && (event.headers.Authorization || event.headers.authorization)) || "";
    if (!auth || !auth.startsWith("Bearer ")) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    // Minimal "token" presence check - adapt to verify Clerk token server-side as needed
    const token = auth.slice("Bearer ".length).trim();
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    // Parse body
    const payload = event.body ? JSON.parse(event.body) : null;
    if (!payload) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing request body" }),
      };
    }

    // Basic validation of required fields that your client sends
    const { job_title, employer, job_date, status, skills, description } = payload;
    if (!job_title || !employer || !status) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // Create a faux saved job record (replace with real DB logic)
    const id = Math.random().toString(36).slice(2);
    // userId extracted as placeholder from token (server should verify token and extract user id)
    const userId = token.split(".")[0] || null;

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

    // TODO: replace with real DB persistence (e.g. MongoDB) and verify Clerk token server-side.
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
