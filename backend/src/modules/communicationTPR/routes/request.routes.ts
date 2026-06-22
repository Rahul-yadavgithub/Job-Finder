import { Router } from 'express';
import { RequestController } from '../controllers/request.controller';
import { verifyCommunicationTPRToken } from '../middleware/auth.middleware';

const router = Router();
const requestController = new RequestController();

router.use(verifyCommunicationTPRToken);

router.get('/queue', requestController.getAllRequests);
router.get('/approvals/pending', requestController.getPendingApprovals);
router.get('/queue/stats', requestController.getQueueCounts);
router.get('/queue/:status', requestController.getRequestsByQueueStatus);
router.get('/company/:companyId', requestController.getCompanyRequests);
router.post('/company/:companyId', requestController.createRequest);
router.patch('/:id/draft', requestController.updateDraft);
router.post('/:id/submit', requestController.submitForApproval);
router.patch('/:id/status', requestController.updateRequestStatus);
router.post('/:id/approve', requestController.approveAndSendRequest);
router.post('/:id/reject', requestController.rejectRequest);
router.post('/:id/revert', requestController.revertRequest);


export default router;
