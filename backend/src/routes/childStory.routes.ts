import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { getPublishedStories, getPublishedStory } from '../controllers/childStory.controller.js';

const router = Router();
router.use(authenticate, requireRole('child'));

router.get('/',    getPublishedStories);
router.get('/:id', getPublishedStory);

export default router;
