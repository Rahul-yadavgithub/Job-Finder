require('dotenv').config();
const mongoose = require('mongoose');

const MAPPINGS = {
  // MNC (mnc) -> MNC (circuital)
  '9a8ffd49-1b2b-4b54-b590-25d6ec1aaa21': '11111111-1111-1111-1111-111111111111',
  // CSE (cse) -> Computer Science and Engineering
  '6df40a38-c32e-4e38-aafc-521d52dfae2f': 'd29c79ff-d7c8-4708-a64d-4551033ae874',
  // IT (it) -> CSE
  'a6622226-3a5d-4a99-aa7e-0f783bbcbd9a': 'd29c79ff-d7c8-4708-a64d-4551033ae874',
  // MBA (mba) -> CSE
  '123371c0-2bcb-4569-9487-738f46db2e76': 'd29c79ff-d7c8-4708-a64d-4551033ae874',
  // MCA (mca) -> CSE
  '7c385fe7-112c-4aed-8814-d39d13363dd8': 'd29c79ff-d7c8-4708-a64d-4551033ae874',
  // Mechanical (mech) -> Mechanical Engineering
  '3f7f583d-6d88-4b34-a8b5-fb5e72ecc482': 'f5f51327-b5b3-4d8c-9c92-1b6eaeca67af',
  // Civil (civil) -> Civil Engineering
  '3b04c9a1-4fbb-4c20-8151-8a90be71c411': '92b914e7-15ed-473a-a2ee-ad1190f964f8',
  // Electronics (ece) -> Electronics and Communication
  '77085d5d-961a-4018-90fd-f5e75717b52e': 'c3c4e083-662e-4bde-a3f9-8d5ad362e624',
};

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;

  const Company = db.collection('companies');
  const SyncJob = db.collection('syncjobs');
  
  for (const [oldId, newId] of Object.entries(MAPPINGS)) {
    console.log(`Remapping MongoDB ${oldId} -> ${newId}`);
    
    // Remap companies
    const resComp = await Company.updateMany(
      { assignedBranch: oldId },
      { $set: { assignedBranch: newId } }
    );
    if (resComp.modifiedCount > 0) console.log(`  Updated ${resComp.modifiedCount} companies`);
    
    // Remap SyncJob
    const resSync = await SyncJob.updateMany(
      { branchId: oldId },
      { $set: { branchId: newId } }
    );
    if (resSync.modifiedCount > 0) console.log(`  Updated ${resSync.modifiedCount} syncjobs`);
  }

  console.log('MongoDB remap complete!');
  await mongoose.disconnect();
}

run().catch(console.error);
