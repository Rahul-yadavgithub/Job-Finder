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

router.get('/people/overview', requireAdminRole('head', 'caller', 'coordinator'), getPeopleStats);
router.get('/people/coworkers', requireAdminRole('head', 'caller', 'coordinator'), getCoworkers);
router.get('/people/branch-tprs', requireAdminRole('head', 'caller', 'coordinator'), getBranchTprs);
router.get('/people/communication-tprs', requireAdminRole('head', 'caller', 'coordinator'), getCommunicationTprs);
router.post('/people/:userId/revoke', requireSuperAdmin, revokeApproval);
router.post('/people/:userId/promote-comm-tpr', requireSuperAdmin, promoteToCommunicationTpr);
router.post('/people/:userId/demote-comm-tpr', requireSuperAdmin, demoteToBranchTpr);

export default router;
