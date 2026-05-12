import { Request, Response } from 'express';
import * as service from '../services/childDailyQuest.service.js';

export const getTodayStatus = async (req: Request, res: Response) => {
  try {
    const childId = (req as any).user.userId;
    const result = await service.getTodayStatus(childId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const startDailyQuest = async (req: Request, res: Response) => {
  try {
    const childId = (req as any).user.userId;
    const result = await service.startDailyQuest(childId);
    res.json(result);
  } catch (err: any) {
    const status = err.message.includes('already completed') ? 409 : 500;
    res.status(status).json({ message: err.message });
  }
};

export const submitDailyQuest = async (req: Request, res: Response) => {
  try {
    const childId = (req as any).user.userId;
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      res.status(400).json({ message: 'answers array is required' });
      return;
    }
    const result = await service.submitDailyQuest(childId, answers);
    res.json(result);
  } catch (err: any) {
    const status = err.message.includes('already completed') ? 409 : 500;
    res.status(status).json({ message: err.message });
  }
};
