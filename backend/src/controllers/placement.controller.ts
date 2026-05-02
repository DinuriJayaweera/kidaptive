import { Request, Response } from 'express';
import PlacementQuestion from '../models/placement.model.js';

export const getStats = async (_req: Request, res: Response): Promise<void> => {
    try {
        // Backfill any existing docs that don't have a difficulty set yet
        await PlacementQuestion.updateMany(
            { difficulty: { $exists: false } },
            { $set: { difficulty: 'medium' } }
        );

        const [total, diffCounts] = await Promise.all([
            PlacementQuestion.countDocuments(),
            PlacementQuestion.aggregate([
                // Treat missing/null difficulty as 'medium'
                { $group: { _id: { $ifNull: ['$difficulty', 'medium'] }, count: { $sum: 1 } } }
            ])
        ]);
        const stats = { total, easy: 0, medium: 0, hard: 0 };
        for (const entry of diffCounts) {
            if (entry._id === 'easy')   stats.easy   = entry.count;
            if (entry._id === 'medium') stats.medium = entry.count;
            if (entry._id === 'hard')   stats.hard   = entry.count;
        }
        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
};

export const getQuestions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { ageGroup, category, difficulty, page = '1', limit = '8', search } = req.query;
        const query: any = {};
        
        if (ageGroup && ageGroup !== 'All') query.ageGroup = ageGroup;
        if (category && category !== 'All') query.category = category;
        if (difficulty && difficulty !== 'All') query.difficulty = difficulty;
        if (search) {
            query.questionText = { $regex: search, $options: 'i' };
        }


        const p = parseInt(page as string, 10) || 1;
        const l = parseInt(limit as string, 10) || 8;
        const skip = (p - 1) * l;

        const [questions, total] = await Promise.all([
            PlacementQuestion.find(query).skip(skip).limit(l).sort({ createdAt: -1 }),
            PlacementQuestion.countDocuments(query)
        ]);

        res.json({ questions, total, page: p, pages: Math.ceil(total / l) });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ message: 'Failed to fetch questions' });
    }
};

export const createQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
        const question = new PlacementQuestion(req.body);
        await question.save();
        res.status(201).json(question);
    } catch (error) {
        console.error('Error creating question:', error);
        res.status(400).json({ message: 'Failed to create question' });
    }
};

export const updateQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const question = await PlacementQuestion.findByIdAndUpdate(id, req.body, { new: true });
        if (!question) {
            res.status(404).json({ message: 'Question not found' });
            return;
        }
        res.json(question);
    } catch (error) {
        console.error('Error updating question:', error);
        res.status(400).json({ message: 'Failed to update question' });
    }
};

export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const question = await PlacementQuestion.findByIdAndDelete(id);
        if (!question) {
            res.status(404).json({ message: 'Question not found' });
            return;
        }
        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ message: 'Failed to delete question' });
    }
};
