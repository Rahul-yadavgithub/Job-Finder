import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
const frontendUrl = process.env.FRONTEND_URL 
  ? (process.env.FRONTEND_URL.startsWith('http') ? process.env.FRONTEND_URL : `https://${process.env.FRONTEND_URL}`)
  : '*';

app.use(cors({
  origin: frontendUrl,
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));

import apiRoutes from './routes/api';

// Connect DB
connectDB();

// Initialize Schedulers
import { initSchedulers } from './scheduler/job-scheduler';
initSchedulers();

// API Routes
app.use('/api', apiRoutes);

// Basic route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
