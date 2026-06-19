import { googleSheetService } from './src/services/google/GoogleSheetProvider';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await (googleSheetService as any).initialize();
  const spreadsheet = await (googleSheetService as any).sheets.spreadsheets.get({ spreadsheetId: '10dUUU7sDlUaetUEoey7eH_KITuJ-eC-JgoUK3M_LiXw' });
  const tabs = spreadsheet.data.sheets.map((s: any) => s.properties.title);
  console.log('TABS:', tabs);
  process.exit(0);
}
run();
