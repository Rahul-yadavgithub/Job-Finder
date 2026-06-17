import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const Company = mongoose.model('Company', new mongoose.Schema({
  companyName: String,
  normalizedName: String,
  assignedBranch: String,
  createdAt: Date
}, { strict: false }));

const Branch = mongoose.model('Branch', new mongoose.Schema({
  name: String,
  category: String
}));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  const branches = await Branch.find();
  const categoryMap = new Map(branches.map(b => [b.name, b.category]));
  
  const companies = await Company.find().sort({ createdAt: 1 });
  const seen = new Set();
  let deleted = 0;
  
  for (const c of companies) {
    const cat = categoryMap.get(c.assignedBranch) || 'Unknown';
    const key = `${c.normalizedName}-${cat}`;
    if (seen.has(key)) {
      await Company.deleteOne({ _id: c._id });
      deleted++;
    } else {
      seen.add(key);
    }
  }
  
  console.log(`Deleted ${deleted} duplicate companies.`);
  process.exit(0);
}
run();
