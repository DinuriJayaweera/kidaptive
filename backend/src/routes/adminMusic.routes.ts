import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { musicUpload } from '../middleware/upload.middleware.js';
import {
    getMusic,
    createMusic,
    updateMusic,
    deleteMusic,
    toggleMusicStatus,
} from '../controllers/adminMusic.controller.js';

const router = Router();
router.use(authenticate, requireRole('admin'));

const upload = musicUpload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
]);

router.get('/',              getMusic);
router.post('/',             upload, createMusic);
router.put('/:id',           upload, updateMusic);
router.delete('/:id',        deleteMusic);
router.patch('/:id/status',  toggleMusicStatus);

export default router;
