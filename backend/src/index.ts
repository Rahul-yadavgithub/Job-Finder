import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
const frontendUrl = process.env.FRONTEND_URL 
  ? (process.env.FRONTEND_URL.startsWith('http') ? process.env.FRONTEND_URL : `https://${process.env.FRONTEND_URL}`)
  : 'http://localhost:3000';

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));



import apiRoutes from './routes/api';
import authRoutes from './routes/auth.routes';
import tprRoutes from './routes/tpr.routes';
import adminRoutes from './routes/admin.routes';
import adminAuthRoutes from './routes/adminAuth.routes';
import workerManagementRoutes from './routes/workerManagement.routes';
import leadershipTransferRoutes from './routes/leadershipTransfer.routes';
import callerRoutes from './routes/caller.routes';
import notificationsRoutes from './routes/notifications.routes';
import adminCompanyRoutes from './routes/adminCompany.routes';
import adminPeopleRoutes from './routes/adminPeople.routes';
import adminRequestsRoutes from './routes/adminRequests.routes';
import communicationTPRRoutes from './modules/communicationTPR/routes';
import companyImportRoutes from './modules/companyImport/companyImport.routes';

// Connect DB
connectDB();

// Initialize Schedulers
import { initSchedulers } from './scheduler/job-scheduler';
initSchedulers();

// API Routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tpr', tprRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', workerManagementRoutes);
app.use('/api/admin', leadershipTransferRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', notificationsRoutes);
app.use('/api/admin', adminCompanyRoutes);
app.use('/api/admin', adminPeopleRoutes);
app.use('/api/admin', adminRequestsRoutes);
app.use('/api/caller', callerRoutes);
app.use('/api/communication-tpr', communicationTPRRoutes);
app.use('/api/tpr/import', companyImportRoutes);

// Basic route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

