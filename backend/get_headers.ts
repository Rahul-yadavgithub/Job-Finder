import { googleSheetService } from './src/services/google/GoogleSheetProvider';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const data = await googleSheetService.fetchFirstSheetData('10dUUU7sDlUaetUEoey7eH_KITuJ-eC-JgoUK3M_LiXw');
  console.log('HEADERS:', data[0]);
  process.exit(0);
}
run();
