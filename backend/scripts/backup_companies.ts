import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import Company from '../src/models/Company';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobfinder';

async function runBackup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    const companies = await Company.find({}).lean();
    console.log(`Found ${companies.length} companies to backup.`);

    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // JSON Backup
    const jsonPath = path.join(backupDir, 'companies_backup.json');
    fs.writeFileSync(jsonPath, JSON.stringify(companies, null, 2));
    console.log(`JSON Backup saved to ${jsonPath}`);

    // CSV Backup
    if (companies.length > 0) {
      const csvPath = path.join(backupDir, 'companies_backup.csv');
      const headers = Object.keys(companies[0]).filter(k => k !== '__v');
      
      let csvContent = headers.join(',') + '\n';
      
      for (const comp of companies) {
        const row = headers.map(header => {
          let val = (comp as any)[header];
          if (val === null || val === undefined) return '';
          if (typeof val === 'object') val = JSON.stringify(val);
          // Escape quotes and commas
          val = String(val).replace(/"/g, '""');
          return `"${val}"`;
        });
        csvContent += row.join(',') + '\n';
      }
      
      fs.writeFileSync(csvPath, csvContent);
      console.log(`CSV Backup saved to ${csvPath}`);
    } else {
      console.log('No data to write to CSV.');
    }

    console.log('Backup complete.');
  } catch (err) {
    console.error('Backup failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

runBackup();
