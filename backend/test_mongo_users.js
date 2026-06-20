require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));
  
  const users = await db.collection('users').find({}).toArray();
  console.log('Users count:', users.length);
  if (users.length > 0) {
    console.log('Sample user branchId:', users[0].branchId || users[0].assignedBranch || users[0].branch);
  }
  await mongoose.disconnect();
}
run().catch(console.error);
