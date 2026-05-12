import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { startSession, heartbeat } from '../controllers/childSession.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('child'));

router.post('/start', startSession);
router.post('/heartbeat', heartbeat);

export default router;
