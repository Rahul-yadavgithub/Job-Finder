import { Router } from 'express';
import { RequestController } from '../controllers/request.controller';
import { verifyCommunicationTPRToken } from '../middleware/auth.middleware';

const router = Router();
const requestController = new RequestController();

router.use(verifyCommunicationTPRToken);

router.get('/queue', requestController.getAllRequests);
router.get('/company/:companyId', requestController.getCompanyRequests);
router.post('/company/:companyId', requestController.createRequest);
router.patch('/:id/status', requestController.updateRequestStatus);

export default router;
