import { Request, Response } from 'express';
import ChildSession from '../models/childSession.model.js';

// A session with no heartbeat for 3+ minutes is considered abandoned
const STALE_THRESHOLD_MS = 3 * 60 * 1000;

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// POST /child/session/start
export const startSession = async (req: Request, res: Response) => {
  try {
    const childId = (req as any).user.userId;
    const now = new Date();
    const date = getTodayDate();

    // If an active session exists (heartbeat within STALE_THRESHOLD), resume it
    const staleThreshold = new Date(now.getTime() - STALE_THRESHOLD_MS);
    const active = await ChildSession.findOne({
      childId,
      date,
      lastHeartbeat: { $gte: staleThreshold },
    }).sort({ lastHeartbeat: -1 });

    if (active) {
      active.lastHeartbeat = now;
      await active.save();
      return res.json({ sessionId: active._id });
    }

    const session = await ChildSession.create({
      childId,
      date,
      sessionStart: now,
      lastHeartbeat: now,
    });

    res.json({ sessionId: session._id });
  } catch (err) {
    console.error('startSession error:', err);
    res.status(500).json({ message: 'Failed to start session.' });
  }
};

// POST /child/session/heartbeat
export const heartbeat = async (req: Request, res: Response) => {
  try {
    const childId = (req as any).user.userId;
    const { sessionId } = req.body;

    if (!sessionId) return res.status(400).json({ message: 'sessionId required' });

    const session = await ChildSession.findOne({ _id: sessionId, childId });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.lastHeartbeat = new Date();
    await session.save();

    res.json({ ok: true });
  } catch (err) {
    console.error('heartbeat error:', err);
    res.status(500).json({ message: 'Failed to update heartbeat.' });
  }
};
