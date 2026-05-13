import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { storyUpload } from '../middleware/upload.middleware.js';
import {
    getStories,
    createStory,
    updateStory,
    deleteStory,
    toggleStoryStatus,
} from '../controllers/adminStory.controller.js';

const router = Router();
router.use(authenticate, requireRole('admin'));

const upload = storyUpload.fields([
    { name: 'pdf',   maxCount: 1 },
    { name: 'cover', maxCount: 1 },
]);

router.get('/',            getStories);
router.post('/',           upload, createStory);
router.put('/:id',         upload, updateStory);
router.delete('/:id',      deleteStory);
router.patch('/:id/status', toggleStoryStatus);

export default router;
