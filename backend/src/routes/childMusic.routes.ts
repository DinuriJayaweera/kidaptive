import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { getPublishedMusic, getPublishedTrack } from '../controllers/childMusic.controller.js';

const router = Router();
router.use(authenticate, requireRole('child'));

router.get('/',    getPublishedMusic);
router.get('/:id', getPublishedTrack);

export default router;
