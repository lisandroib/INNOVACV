const { MongoClient } = require('mongodb');
const fs = require('fs');

// Try to read .env.local to get MONGODB_URI
let uri = '';
try {
  const env = fs.readFileSync('.env.local', 'utf-8');
  const match = env.match(/MONGODB_URI=(.*)/);
  if (match) uri = match[1].trim();
} catch (e) {}

if (!uri) uri = 'mongodb://localhost:27017'; // fallback

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('innovacv_db');
    const profile = await db.collection('perfiles').findOne({});
    console.log("FIRST PROFILE:", JSON.stringify(profile, null, 2));
  } finally {
    await client.close();
  }
}
run().catch(console.error);
