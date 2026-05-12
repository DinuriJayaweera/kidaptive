import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { getTodayStatus, startDailyQuest, submitDailyQuest } from '../controllers/childDailyQuest.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('child'));

router.get('/today',  getTodayStatus);
router.post('/start', startDailyQuest);
router.post('/submit', submitDailyQuest);

export default router;
