import mongoose from "mongoose";
import PlacementQuestion from "../../models/placement.model.js";
import User from "../../models/User.js";

// Creates a full set of questions for one category
// 1 easy + 2 medium + 2 hard = 5 questions (minimum needed per category)
export async function createCategoryQuestions(
    category: string,
    ageGroup: string = "7-8",
) {
    const questions = [
        // Easy (1)
        {
            questionText: `Easy question about ${category}`,
            ageGroup,
            category,
            type: "mcq" as const,
            difficulty: "easy" as const,
            options: ["A", "B", "C", "D"],
            correctAnswer: "A",
        },
        // Medium (2)
        {
            questionText: `Medium question 1 about ${category}`,
            ageGroup,
            category,
            type: "mcq" as const,
            difficulty: "medium" as const,
            options: ["A", "B", "C", "D"],
            correctAnswer: "B",
        },
        {
            questionText: `Medium question 2 about ${category}`,
            ageGroup,
            category,
            type: "mcq" as const,
            difficulty: "medium" as const,
            options: ["A", "B", "C", "D"],
            correctAnswer: "B",
        },
        // Hard (2)
        {
            questionText: `Hard question 1 about ${category}`,
            ageGroup,
            category,
            type: "mcq" as const,
            difficulty: "hard" as const,
            options: ["A", "B", "C", "D"],
            correctAnswer: "C",
        },
        {
            questionText: `Hard question 2 about ${category}`,
            ageGroup,
            category,
            type: "mcq" as const,
            difficulty: "hard" as const,
            options: ["A", "B", "C", "D"],
            correctAnswer: "C",
        },
    ];

    return PlacementQuestion.insertMany(questions);
}

// Creates multiple categories (for multi-test scenario)
export async function createMultipleCategoryQuestions(
    categories: string[],
    ageGroup: string = "7-8",
) {
    for (const category of categories) {
        await createCategoryQuestions(category, ageGroup);
    }
}

// Creates a child user for testing placement
export async function createTestChild(age: number = 7) {
    return User.create({
        name: "Test Child",
        email: `child-${Date.now()}@child.kidaptive.local`,
        username: `testchild${Date.now()}`,
        password: "dummy",
        role: "child",
        age,
        emailVerified: true,
        tokenVersion: 0,
        loginMethod: "emoji",
        emojiPassword: "😀😃😄😁",
        parentId: new mongoose.Types.ObjectId(),
    });
}