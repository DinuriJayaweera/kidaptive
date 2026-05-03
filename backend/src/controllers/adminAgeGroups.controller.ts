import { Request, Response, NextFunction } from "express";
import QuizQuestion from "../models/quizQuestion.model.js";
import PlacementQuestion from "../models/placement.model.js";
import PlacementResult from "../models/placementResult.model.js";
import Category from "../models/category.model.js";

const AGE_GROUPS = ["5-6", "7-8", "9-10"];

export async function getAgeGroupStats(req: Request, res: Response, next: NextFunction) {
    try {
        const results = await Promise.all(
            AGE_GROUPS.map(async (ag) => {
                const [children, quizQuestions, placementQuestions, categories] = await Promise.all([
                    PlacementResult.countDocuments({ ageGroup: ag }),
                    QuizQuestion.countDocuments({ ageGroup: ag }),
                    PlacementQuestion.countDocuments({ ageGroup: ag }),
                    Category.find({ ageGroups: ag }).select("name status ageGroups").lean(),
                ]);
                return { ageGroup: ag, children, quizQuestions, placementQuestions, categories };
            })
        );

        res.json(results);
    } catch (err) {
        next(err);
    }
}
