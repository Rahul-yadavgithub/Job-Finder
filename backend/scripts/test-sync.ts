import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { googleSheetService } from '../src/services/google/GoogleSheetProvider';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const Company = mongoose.model('Company', new mongoose.Schema({}, { strict: false }));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  const companies = await Company.find({ assignedBranch: 'CSE' }).limit(5);
  console.log(`Found ${companies.length} companies for CSE`);
  
  try {
    await googleSheetService.appendCompaniesToSheet(companies as any, 'CSE');
    console.log('Sync successful');
  } catch (error: any) {
    console.error('SYNC ERROR:', error.response?.data || error.message);
  }
  
  process.exit(0);
}
run();
