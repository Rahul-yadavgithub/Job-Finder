require('dotenv').config();
const { getDashboardCounts, getBranchCompanies } = require('./src/services/company.queries');

async function run() {
  const mncId = '11111111-1111-1111-1111-111111111111';
  
  const counts = await getDashboardCounts(mncId);
  console.log('Dashboard Counts:', counts);
  
  const companies = await getBranchCompanies(mncId, 1, 10, '', 'pending');
  console.log('Pending Companies Count:', companies.data?.length || 0);
}

run().catch(console.error);
