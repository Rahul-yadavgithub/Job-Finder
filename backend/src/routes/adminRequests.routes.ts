import { Router } from 'express';
import { verifyAdminToken, requireAdminRole } from '../middleware/adminAuth.middleware';
import { requireJumpedIn } from '../middleware/jumpedIn.middleware';
import {
  getRequests,
  previewRequest,
  actionRequest,
  logCompanyResponse,
  confirmDrive,
  openRegistration,
  getDriveDetails,
  getAllDrives
} from '../controllers/adminRequests.controller';
import { jumpIn, jumpOut } from '../controllers/adminAuth.controller';
import { getTimeline } from '../services/timeline.service';

const router = Router();

router.use(verifyAdminToken);
router.use(requireAdminRole('head', 'caller', 'coordinator'));

// Auth Overrides
router.post('/auth/jump-in', jumpIn);
router.post('/auth/jump-out', jumpOut);

// Admin Requests
router.get('/requests', getRequests);
router.get('/requests/:id/preview', previewRequest);
router.post('/requests/:id/action', actionRequest);
router.post('/requests/log-response', logCompanyResponse);

// Drives
router.post('/drives/confirm', requireJumpedIn, confirmDrive);
router.post('/drives/:id/open-registration', requireJumpedIn, openRegistration);
router.get('/drives/all', getAllDrives);
router.get('/drives/:assignmentId', getDriveDetails);

// Timeline
router.get('/timeline/:companyId', async (req, res) => {
  try {
    const events = await getTimeline(req.params.companyId, 'admin');
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch timeline' });
  }
});

export default router;
