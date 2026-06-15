import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const branchSchema = new mongoose.Schema({ name: String }, { strict: false });
const Branch = mongoose.models.Branch || mongoose.model('Branch', branchSchema);

const companySchema = new mongoose.Schema({ assignedBranch: String }, { strict: false });
const Company = mongoose.models.Company || mongoose.model('Company', companySchema);

async function run() {
  const MONGO_URI = process.env.MONGODB_URI|| 'mongodb://localhost:27017/jobfinder';
  if (!MONGO_URI) {
    console.error('MONGO_URI is missing');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected');
  
  const bRes = await Branch.updateOne({ name: 'EEE' }, { $set: { name: 'EE' } });
  console.log('Branch update:', bRes);
  
  const cRes = await Company.updateMany({ assignedBranch: 'EEE' }, { $set: { assignedBranch: 'EE' } });
  console.log('Company update:', cRes);
  
  process.exit(0);
}

run().catch(console.error);
