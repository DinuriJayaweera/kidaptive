import { Router } from 'express';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '../controllers/placement.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Only admin should manage these
router.use(authenticate);
router.use(requireRole('admin'));

router.get('/', getQuestions);
router.post('/', createQuestion);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);

export default router;
