import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    await mongoose.connection.db!.dropCollection('companies');
    console.log('Successfully dropped companies collection');
  } catch (err: any) {
    if (err.code === 26) {
      console.log('Collection companies does not exist, nothing to drop');
    } else {
      console.error('Error dropping collection:', err);
    }
  } finally {
    await mongoose.disconnect();
  }
}
run();
