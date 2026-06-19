require('dotenv').config();
const { googleSheetService } = require('./build/services/google/GoogleSheetProvider');

async function run() {
  const data = await googleSheetService.fetchFirstSheetData('10dUUU7sDlUaetUEoey7eH_KITuJ-eC-JgoUK3M_LiXw');
  console.log('Headers:', data[0]);
  console.log('First Row:', data[1]);
}
run();
