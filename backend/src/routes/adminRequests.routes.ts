import { Router } from 'express';
import { verifyAdminToken, requireAdminRole } from '../middleware/adminAuth.middleware';
import { requireJumpedIn } from '../middleware/jumpedIn.middleware';
import { cache } from '../middleware/cache.middleware';
import {
  getRequests,
  previewRequest,
  actionRequest,
  logCompanyResponse,
  confirmDrive,
  updateDriveDate,
  openRegistration,
  getDriveDetails,
  getAllDrives,
  getWorkflowTemplates,
  getCompanyWorkflows,
  transitionWorkflowState,
  addCustomWorkflowStage,
  addCustomTimelineEvent,
  delegateTask,
  getMyTasks,
  updateTaskStatus,
  getCoworkerDashboardStats,
  deleteTask
} from '../controllers/adminRequests.controller';
import { jumpIn, jumpOut } from '../controllers/adminAuth.controller';
import { getTimeline } from '../services/timeline.service';
import { getTemplates, uploadTemplate } from '../controllers/adminSettings.controller';
import {
  getStaffRequests,
  sendStaffRequest,
  markResponse,
  rejectStaffRequest,
  archiveStaffRequest
} from '../controllers/staffRequests.controller';

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
router.patch('/drives/:id/date', requireJumpedIn, updateDriveDate);
router.post('/drives/:id/open-registration', requireJumpedIn, openRegistration);
router.get('/drives/all', getAllDrives);
router.get('/drives/:assignmentId', getDriveDetails);

// Timeline & Workflows
router.get('/workflow-templates', getWorkflowTemplates);
router.get('/companies/:companyId/workflows', getCompanyWorkflows);
router.post('/companies/:companyId/workflows/custom', addCustomWorkflowStage);
router.patch('/workflow/:assignmentId/:workflowType', transitionWorkflowState);
router.post('/timeline/:companyId/custom', addCustomTimelineEvent);

// Tasks
router.post('/tasks', delegateTask);
router.get('/tasks/my-tasks', getMyTasks);
router.patch('/tasks/:taskId/execute', updateTaskStatus);
router.delete('/tasks/:taskId', deleteTask);
// Staff Requests (New TPO Staff Queue)
router.get('/staff/requests', getStaffRequests);
router.post('/staff/requests/:id/send', sendStaffRequest);
router.post('/staff/requests/:id/mark-response', markResponse);
router.post('/staff/requests/:id/reject', rejectStaffRequest);
router.patch('/staff/requests/:id/archive', archiveStaffRequest);

// Dashboard
router.get('/dashboard-stats', cache(60), getCoworkerDashboardStats);

// Settings
router.get('/settings/templates', getTemplates);
router.post('/settings/templates', uploadTemplate);

router.get('/timeline/:companyId', async (req, res) => {
  try {
    const events = await getTimeline(req.params.companyId, 'admin');
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch timeline' });
  }
});

export default router;
