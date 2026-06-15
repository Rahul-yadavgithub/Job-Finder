const mongoose = require('mongoose');
require('dotenv').config({path: './.env'});
const Company = require('./src/models/Company').default;

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const results = await Company.aggregate([
      { $match: { syncStatus: 'pending', assignedBranch: { $exists: true, $ne: null } } },
      { $lookup: {
          from: 'branches',
          localField: 'assignedBranch',
          foreignField: 'name',
          as: 'branchDetails'
        }
      },
      { $unwind: { path: '$branchDetails', preserveNullAndEmptyArrays: true } },
      { $group: { 
          _id: { name: '$assignedBranch', category: '$branchDetails.category' }, 
          count: { $sum: 1 }, 
          companies: { 
            $push: { 
              _id: '$_id', 
              companyName: '$companyName',
              sync_status: '$syncStatus'
            } 
          } 
        } 
      },
      { $project: { _id: 0, branch_name: '$_id.name', branch_category: { $ifNull: ['$_id.category', 'Unknown'] }, count: 1, companies: 1 } },
      { $sort: { branch_category: 1, branch_name: 1 } }
  ]);
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}).catch(console.error);
