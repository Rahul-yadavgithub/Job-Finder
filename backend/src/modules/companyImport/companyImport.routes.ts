import { Router } from 'express';
import multer from 'multer';
import { companyImportController } from './companyImport.controller';
import { verifyToken } from '../../middleware/auth.middleware';

const router = Router();

// Use memory storage for processing files directly
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// All import routes are protected
router.use(verifyToken);

// File upload for Excel/CSV
router.post('/upload', upload.single('file'), companyImportController.uploadFile);

// Import from Google Sheet
router.post('/sheet', companyImportController.importFromSheet);

// Confirm import and process validated rows
router.post('/confirm', companyImportController.confirmImport);

// Get history
router.get('/history', companyImportController.getHistory);

export default router;
