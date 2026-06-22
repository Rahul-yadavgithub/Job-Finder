import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { globalLimiter } from './middleware/rateLimit.middleware';
import http from 'http';
import { connectDB } from './config/db';
import { initSocket } from './config/socket';

dotenv.config();

const app = express();
app.set('trust proxy', 1); // Trust first proxy (Render, Heroku, etc.) to securely extract real IP
const httpServer = http.createServer(app);

// Initialize Socket.io
initSocket(httpServer);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());
app.use(compression());

const getAllowedOrigins = () => {
  const origins: string[] = ['http://localhost:3000', 'http://localhost:3001'];
  
  const parseEnvUrl = (envVar: string | undefined) => {
    if (!envVar) return;
    const urls = envVar.split(',').map(url => url.trim());
    urls.forEach(url => {
      if (!url) return;
      origins.push(url.startsWith('http') ? url : `https://${url}`);
    });
  };

  parseEnvUrl(process.env.FRONTEND_URL);
  parseEnvUrl(process.env.ADMIN_BASE_URL);
  parseEnvUrl(process.env.TPO_ADMIN_BASE_URL);

  return [...new Set(origins)]; // Remove duplicates
};

const allowedOrigins = getAllowedOrigins();

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(helmet.noSniff());
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));

// Apply global rate limiter to all /api routes
app.use('/api/', globalLimiter);

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
import adminUserRequestsRoutes from './routes/adminUserRequests.routes';
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
app.use('/api/admin', adminUserRequestsRoutes);
app.use('/api/caller', callerRoutes);
app.use('/api/communication-tpr', communicationTPRRoutes);
app.use('/api/tpr/import', companyImportRoutes);

// Basic route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

