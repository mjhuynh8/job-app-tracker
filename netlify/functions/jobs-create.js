const { MongoClient } = require("mongodb");
const { getAuth } = require("@clerk/clerk-sdk-node");

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connect() {
  if (!db) {
    await client.connect();
    db = client.db("jobtracker");
  }
  return db;
}

module.exports.handler = async (event) => {
  try {
    const { userId } = getAuth(event);
    if (!userId) return { statusCode: 401, body: "Unauthorized" };

    const body = JSON.parse(event.body || "{}");
    const job = {
      userId,
      job_title: body.job_title,
      employer: body.employer,
      job_date: body.job_date,
      status: body.status,
      skills: body.skills,
      description: body.description,
      rejected: false,
      ghosted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const database = await connect();
    const result = await database.collection("jobs").insertOne(job);
    job._id = result.insertedId;

    return {
      statusCode: 201,
      body: JSON.stringify(job),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
