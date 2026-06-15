import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import Branch from '../src/models/Branch';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobfinder';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const circuital = ['CSE', 'MNC', 'ECE', 'EE', 'EP'];
  const core = ['ME', 'CE', 'CH', 'MSE'];

  const branches = await Branch.find();
  
  for (const branch of branches) {
    let category = 'Core';
    // Match exactly or closely (case-insensitive)
    const upperName = branch.name.toUpperCase();
    if (circuital.includes(upperName)) {
      category = 'Circuital';
    } else if (core.includes(upperName)) {
      category = 'Core';
    } else {
      console.log(`Unknown branch: ${branch.name}, defaulting to Circuital`);
      category = 'Circuital';
    }

    branch.category = category as 'Circuital' | 'Core';
    await branch.save();
    console.log(`Updated ${branch.name} -> ${category}`);
  }

  // Also make sure these branches exist
  const allKnown = [...circuital, ...core];
  for (const name of allKnown) {
    const existing = await Branch.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (!existing) {
      const category = circuital.includes(name) ? 'Circuital' : 'Core';
      await Branch.create({ name, category, sheet_tab_ref: name });
      console.log(`Created new branch ${name} -> ${category}`);
    }
  }

  console.log('Migration complete');
  process.exit(0);
}

run().catch(console.error);
