// MongoDB: used for discovery pipeline, scraper data, AI enrichment,
// API key management, notifications, and raw data only.
// Portal structured data (users, companies, status) lives in Supabase.
import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string, {
      // Connection pool: allow up to 10 concurrent connections
      maxPoolSize: 10,
      minPoolSize: 2,
      // Fail fast if Atlas is unreachable rather than hanging
      serverSelectionTimeoutMS: 5000,
      // Close idle connections after 30s to save resources
      socketTimeoutMS: 30000,
      // Compress data over the wire (reduces latency on slower connections)
      compressors: ['zlib'],
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
