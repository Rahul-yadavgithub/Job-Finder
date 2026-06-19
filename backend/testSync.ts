import { companyImportService } from './src/modules/companyImport/companyImport.service';
import { connectDB } from './src/config/db';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await connectDB();
  const res = await companyImportService.syncMasterSheets();
  console.log('Result:', res);
  process.exit(0);
}
run();
