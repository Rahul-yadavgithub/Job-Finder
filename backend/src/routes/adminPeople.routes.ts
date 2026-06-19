import { Router } from 'express';
import { 
  getPeopleStats, 
  getCoworkers, 
  getBranchTprs, 
  revokeApproval,
  getCommunicationTprs,
  promoteToCommunicationTpr,
  demoteToBranchTpr
} from '../controllers/adminPeople.controller';
import { verifyAdminToken, requireAdminRole, requireSuperAdmin } from '../middleware/adminAuth.middleware';

const router = Router();

router.use(verifyAdminToken);

router.get('/people/stats', requireAdminRole('head', 'caller'), getPeopleStats);
router.get('/people/coworkers', requireAdminRole('head', 'caller'), getCoworkers);
router.get('/people/branch-tprs', requireAdminRole('head', 'caller'), getBranchTprs);
router.get('/people/communication-tprs', requireAdminRole('head', 'caller'), getCommunicationTprs);
router.post('/people/:userId/revoke', requireSuperAdmin, revokeApproval);
router.post('/people/:userId/promote-comm-tpr', requireSuperAdmin, promoteToCommunicationTpr);
router.post('/people/:userId/demote-comm-tpr', requireSuperAdmin, demoteToBranchTpr);

export default router;
