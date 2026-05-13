import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import PasswordResetRequest from '../models/passwordResetRequest.model.js';
import { createNotification } from '../services/notification.service.js';
import { generateOtp, hashOtp, compareOtp, sendResetEmail } from '../utils/email.js';

function pid(req: Request): string {
  return (req as any).user.userId;
}

// ─────────────────────────────────────────────────────────────
// POST /api/child-password-reset/request  (public — child)
// ─────────────────────────────────────────────────────────────
export async function requestPasswordHelp(req: Request, res: Response) {
  try {
    const { username } = req.body as { username?: string };
    if (!username?.trim()) return res.status(400).json({ message: 'Username is required.' });

    const escaped = username.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const child = await User.findOne({
      username: { $regex: new RegExp(`^${escaped}$`, 'i') },
      role: 'child',
    }).select('_id name parentId');

    if (!child?.parentId) {
      // Enumeration-safe: always return success
      return res.json({ message: 'Request sent! Ask your parent to check their notifications.' });
    }

    const recent = await PasswordResetRequest.findOne({
      childId: child._id,
      status: { $in: ['pending', 'otp_sent'] },
      createdAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) },
    });
    if (recent) {
      return res.json({ message: 'Request already sent! Ask your parent to check their notifications.' });
    }

    await PasswordResetRequest.updateMany(
      { childId: child._id, status: { $in: ['pending', 'otp_sent'] } },
      { status: 'expired' },
    );

    await PasswordResetRequest.create({
      childId:   child._id,
      parentId:  child.parentId,
      childName: child.name,
      status:    'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    createNotification(
      child._id.toString(),
      'password_reset_request',
      '🔑 Password Help Request',
      `${child.name} is requesting password help. Tap to reset their emoji pattern.`,
      '🔑',
    ).catch((err) => console.error('[childPasswordReset] notification error:', err));

    return res.json({ message: 'Request sent! Ask your parent to check their notifications.' });
  } catch (err) {
    console.error('requestPasswordHelp error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/child-password-reset/pending/:childId  (parent auth)
// ─────────────────────────────────────────────────────────────
export async function getPendingRequestByChild(req: Request, res: Response) {
  try {
    const parentId   = pid(req);
    const { childId } = req.params;

    await PasswordResetRequest.updateMany(
      { parentId, status: { $in: ['pending', 'otp_sent'] }, expiresAt: { $lte: new Date() } },
      { status: 'expired' },
    );

    const request = await PasswordResetRequest.findOne({
      childId,
      parentId,
      status: { $in: ['pending', 'otp_sent'] },
    });

    return res.json({ request: request ?? null });
  } catch (err) {
    console.error('getPendingRequestByChild error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
}

// ─────────────────────────────────────────────────────────────
// METHOD 1 — Change password using old emoji pattern
// POST /api/child-password-reset/change/:childId  (parent auth)
// ─────────────────────────────────────────────────────────────
export async function changeChildPassword(req: Request, res: Response) {
  try {
    const parentId   = pid(req);
    const { childId } = req.params;
    const { oldEmojiPassword, newEmojiPassword } = req.body as {
      oldEmojiPassword?: string;
      newEmojiPassword?: string;
    };

    if (!oldEmojiPassword || [...oldEmojiPassword].length !== 4) {
      return res.status(400).json({ message: 'Please enter the current 4-emoji pattern.' });
    }
    if (!newEmojiPassword || [...newEmojiPassword].length !== 4) {
      return res.status(400).json({ message: 'Please choose a new 4-emoji pattern.' });
    }

    const child = await User.findOne({ _id: childId, parentId, role: 'child' })
      .select('_id name emojiPassword');

    if (!child) return res.status(404).json({ message: 'Child not found.' });
    if (!child.emojiPassword) return res.status(400).json({ message: 'No emoji password set for this child.' });

    const isValid = await bcrypt.compare(oldEmojiPassword, child.emojiPassword);
    if (!isValid) {
      return res.status(400).json({ message: 'Current pattern is incorrect. Please try again.' });
    }

    const hashed = await bcrypt.hash(newEmojiPassword, 12);
    await User.findByIdAndUpdate(childId, { emojiPassword: hashed });

    // Complete any pending request for this child
    await PasswordResetRequest.updateMany(
      { childId, parentId, status: { $in: ['pending', 'otp_sent'] } },
      { status: 'completed' },
    );

    return res.json({ message: `${child.name}'s pattern has been updated!` });
  } catch (err) {
    console.error('changeChildPassword error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
}

// ─────────────────────────────────────────────────────────────
// METHOD 2a — Send OTP to parent email (forgot flow)
// POST /api/child-password-reset/:requestId/send-otp  (parent auth)
// ─────────────────────────────────────────────────────────────
export async function sendOtp(req: Request, res: Response) {
  try {
    const parentId      = pid(req);
    const { requestId } = req.params;

    const request = await PasswordResetRequest.findOne({
      _id:      requestId,
      parentId,
      status:   { $in: ['pending', 'otp_sent'] },
      expiresAt: { $gt: new Date() },
    });
    if (!request) return res.status(404).json({ message: 'Request not found or expired.' });

    const parent = await User.findById(parentId).select('email name');
    if (!parent) return res.status(404).json({ message: 'Parent account not found.' });

    const otp = generateOtp();
    request.otpHash     = await hashOtp(otp);
    request.otpExpiry   = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    request.otpAttempts = 0;
    request.status      = 'otp_sent';
    await request.save();

    console.log(`\n🎯 [DEV] Child reset OTP for ${parent.email}: ${otp}\n`);
    sendResetEmail(parent.email, otp, parent.name).catch((e) =>
      console.error('[childPasswordReset] email send error:', e),
    );

    const masked = parent.email.replace(/(.{2}).+(@.+)/, '$1***$2');
    return res.json({ message: `Verification code sent to ${masked}` });
  } catch (err) {
    console.error('sendOtp error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
}

// ─────────────────────────────────────────────────────────────
// METHOD 2b — Reset with OTP (forgot flow)
// POST /api/child-password-reset/:requestId/reset  (parent auth)
// ─────────────────────────────────────────────────────────────
export async function resetWithOtp(req: Request, res: Response) {
  try {
    const parentId      = pid(req);
    const { requestId } = req.params;
    const { newEmojiPassword, otp } = req.body as {
      newEmojiPassword?: string;
      otp?: string;
    };

    if (!newEmojiPassword || [...newEmojiPassword].length !== 4) {
      return res.status(400).json({ message: 'Please choose exactly 4 emojis.' });
    }
    if (!otp?.trim()) {
      return res.status(400).json({ message: 'Verification code is required.' });
    }

    const request = await PasswordResetRequest.findOne({
      _id:      requestId,
      parentId,
      status:   'otp_sent',
      expiresAt: { $gt: new Date() },
    });
    if (!request) {
      return res.status(404).json({ message: 'Request not found. Please resend the code.' });
    }

    if (request.otpAttempts >= 5) {
      request.status = 'expired';
      await request.save();
      return res.status(400).json({ message: 'Too many attempts. Please start over.' });
    }

    if (!request.otpHash || !request.otpExpiry || request.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'Code has expired. Please request a new one.' });
    }

    const isValid = await compareOtp(otp.trim(), request.otpHash);
    if (!isValid) {
      request.otpAttempts += 1;
      await request.save();
      const left = 5 - request.otpAttempts;
      return res.status(400).json({ message: `Incorrect code. ${left} attempt${left !== 1 ? 's' : ''} remaining.` });
    }

    const child = await User.findOne({ _id: request.childId, parentId, role: 'child' });
    if (!child) return res.status(403).json({ message: 'Unauthorized.' });

    const hashed = await bcrypt.hash(newEmojiPassword, 12);
    await User.findByIdAndUpdate(request.childId, { emojiPassword: hashed });

    request.status = 'completed';
    await request.save();

    return res.json({ message: `${request.childName}'s pattern has been reset!` });
  } catch (err) {
    console.error('resetWithOtp error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
}
