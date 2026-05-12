import { Router } from 'express';
import { getStats, getQuestions, createQuestion, updateQuestion, deleteQuestion } from '../controllers/dailyQuest.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/stats', getStats);
router.get('/', getQuestions);
router.post('/', createQuestion);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);

export default router;
