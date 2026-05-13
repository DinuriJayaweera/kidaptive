import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import {
  requestPasswordHelp,
  getPendingRequestByChild,
  changeChildPassword,
  sendOtp,
  resetWithOtp,
} from '../controllers/childPasswordReset.controller.js';

const router = Router();

// Public — child submits username on the forgot page
router.post('/request', requestPasswordHelp);

// Parent auth ───────────────────────────────────────────────
const parentAuth = [authenticate, requireRole('parent')] as const;

// Query pending request for a child
router.get('/pending/:childId',       ...parentAuth, getPendingRequestByChild);

// Method 1: change using old emoji pattern (no pending request needed)
router.post('/change/:childId',       ...parentAuth, changeChildPassword);

// Method 2: forgot flow — OTP to parent email
router.post('/:requestId/send-otp',   ...parentAuth, sendOtp);
router.post('/:requestId/reset',      ...parentAuth, resetWithOtp);

export default router;
