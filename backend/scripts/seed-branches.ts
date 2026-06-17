import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Branch from '../src/models/Branch';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const branches = [
  { name: 'CSE', category: 'Circuital' },
  { name: 'ECE', category: 'Circuital' },
  { name: 'EE', category: 'Circuital' },
  { name: 'MNC', category: 'Circuital' },
  { name: 'ME', category: 'Core' },
  { name: 'CE', category: 'Core' },
  { name: 'MSE', category: 'Core'},
  { name: 'EP', category: 'Core'},
  { name: 'CH', category: 'Core'}
];

async function seedBranches() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in the environment');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    console.log('Seeding branches...');
    for (const branchData of branches) {
      await Branch.findOneAndUpdate(
        { name: branchData.name },
        branchData,
        { upsert: true, new: true }
      );
      console.log(`Upserted branch: ${branchData.name}`);
    }

    console.log('Branch seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding branches:', error);
    process.exit(1);
  }
}

seedBranches();
