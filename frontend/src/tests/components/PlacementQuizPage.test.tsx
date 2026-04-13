import { screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock the placement API
vi.mock("../../features/child/services/placementTestApi", () => ({
    placementTestApi: {
        generate: vi.fn(),
        submit: vi.fn(),
        reset: vi.fn(),
        getStatus: vi.fn(),
        getResults: vi.fn(),
    },
}));

// Mock CSS imports
vi.mock("../../features/child/pages/PlacementQuiz.css", () => ({}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return { ...actual, useNavigate: () => mockNavigate };
});

import PlacementQuizPage from "../../features/child/pages/PlacementQuizPage";
import { placementTestApi } from "../../features/child/services/placementTestApi";

// ── Sample test data ──────────────────────────────────────────────────────────
const mockMCQQuestion = {
    _id: "q1",
    questionText: "What is a noun?",
    type: "mcq" as const,
    category: "Nouns",
    difficulty: "easy",
    options: ["A person, place, or thing", "An action word", "A describing word", "A connecting word"],
};

const mockFillQuestion = {
    _id: "q2",
    questionText: "The dog ____ in the park.",
    type: "fill" as const,
    category: "Verbs",
    difficulty: "medium",
    options: ["runs", "run", "running", "ran"],
};

const mockInputQuestion = {
    _id: "q3",
    questionText: "Type the missing word: The ____ is blue.",
    type: "input" as const,
    category: "Adjectives",
    difficulty: "hard",
    options: [],
};

const mockBooleanQuestion = {
    _id: "q4",
    questionText: "Is 'quickly' an adverb?",
    type: "boolean" as const,
    category: "Adverbs",
    difficulty: "easy",
    options: ["True", "False"],
};

const mockGenerateResponse = {
    data: {
        questions: [mockMCQQuestion],
        categories: ["Nouns"],
        testNumber: 1,
        totalCategories: 1,
        correctAnswers: { q1: "A person, place, or thing" },
    },
};

function renderQuiz() {
    return render(
        <MemoryRouter>
            <PlacementQuizPage />
        </MemoryRouter>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
describe("PlacementQuizPage", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Loading state ──────────────────────────────────────────────────────────

    it("shows loading spinner while fetching questions", async () => {
        // Keep the promise pending so loading stays visible
        vi.mocked(placementTestApi.generate).mockReturnValue(new Promise(() => {}));

        renderQuiz();
        expect(screen.getByText(/loading questions/i)).toBeInTheDocument();
    });

    // ── Question rendering ─────────────────────────────────────────────────────

    it("renders MCQ question with options after loading", async () => {
        vi.mocked(placementTestApi.generate).mockResolvedValueOnce(mockGenerateResponse as any);

        renderQuiz();

        await waitFor(() => {
            expect(screen.getByText("What is a noun?")).toBeInTheDocument();
        });

        expect(screen.getByText("A person, place, or thing")).toBeInTheDocument();
        expect(screen.getByText("An action word")).toBeInTheDocument();
        expect(screen.getByText("A describing word")).toBeInTheDocument();
    });

    it("shows correct title for MCQ question type", async () => {
        vi.mocked(placementTestApi.generate).mockResolvedValueOnce(mockGenerateResponse as any);
        renderQuiz();

        await waitFor(() => {
            expect(screen.getByText("Choose the correct answer")).toBeInTheDocument();
        });
    });

    it("shows correct title for fill-in-the-blank question type", async () => {
        vi.mocked(placementTestApi.generate).mockResolvedValueOnce({
            data: {
                ...mockGenerateResponse.data,
                questions: [mockFillQuestion],
                correctAnswers: { q2: "runs" },
            },
        } as any);

        renderQuiz();

        await waitFor(() => {
            expect(screen.getByText("Fill in the blank")).toBeInTheDocument();
        });
    });

    it("shows correct title for input question type", async () => {
        vi.mocked(placementTestApi.generate).mockResolvedValueOnce({
            data: {
                ...mockGenerateResponse.data,
                questions: [mockInputQuestion],
                correctAnswers: { q3: "sky" },
            },
        } as any);

        renderQuiz();

        await waitFor(() => {
            expect(screen.getByText("Type the missing word")).toBeInTheDocument();
        });
    });

    it("shows correct title for true/false question type", async () => {
        vi.mocked(placementTestApi.generate).mockResolvedValueOnce({
            data: {
                ...mockGenerateResponse.data,
                questions: [mockBooleanQuestion],
                correctAnswers: { q4: "True" },
            },
        } as any);

        renderQuiz();

        await waitFor(() => {
            expect(screen.getByText("True or False?")).toBeInTheDocument();
        });
    });

    it("shows question counter 1/N", async () => {
        vi.mocked(placementTestApi.generate).mockResolvedValueOnce(mockGenerateResponse as any);
        renderQuiz();

        await waitFor(() => {
            expect(screen.getByText("1/1")).toBeInTheDocument();
        });
    });

    it("shows Skip and Check buttons", async () => {
        vi.mocked(placementTestApi.generate).mockResolvedValueOnce(mockGenerateResponse as any);
        renderQuiz();

        await waitFor(() => {
            expect(screen.getByText("Skip")).toBeInTheDocument();
            expect(screen.getByText("Check")).toBeInTheDocument();
        });
    });

    it("Check button is disabled when no answer selected", async () => {
        vi.mocked(placementTestApi.generate).mockResolvedValueOnce(mockGenerateResponse as any);
        renderQuiz();

        await waitFor(() => {
            const checkBtn = screen.getByText("Check");
            expect(checkBtn).toBeDisabled();
        });
    });

    // ── Answer selection ───────────────────────────────────────────────────────

    it("enables Check button after selecting an answer", async () => {
        vi.mocked(placementTestApi.generate).mockResolvedValueOnce(mockGenerateResponse as any);
        renderQuiz();

        await waitFor(() => {
            expect(screen.getByText("A person, place, or thing")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("A person, place, or thing"));

        expect(screen.getByText("Check")).not.toBeDisabled();
    });

    // ── Correct answer flow ────────────────────────────────────────────────────

    it("shows Amazing feedback when correct answer is selected", async () => {
        vi.mocked(placementTestApi.generate).mockResolvedValueOnce(mockGenerateResponse as any);
        renderQuiz();

        await waitFor(() => {
            expect(screen.getByText("A person, place, or thing")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("A person, place, or thing"));
        fireEvent.click(screen.getByText("Check"));

        await waitFor(() => {
            expect(screen.getByText("Amazing!")).toBeInTheDocument();
        });
    });

    it("shows Continue button after checking correct answer", async () => {
        vi.mocked(placementTestApi.generate).mockResolvedValueOnce(mockGenerateResponse as any);
        renderQuiz();

        await waitFor(() => {
            expect(screen.getByText("A person, place, or thing")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("A person, place, or thing"));
        fireEvent.click(screen.getByText("Check"));

        await waitFor(() => {
            expect(screen.getByText("Continue")).toBeInTheDocument();
        });
    });

    // ── Wrong answer flow ──────────────────────────────────────────────────────

    it("shows correct solution when wrong answer selected", async () => {
        vi.mocked(placementTestApi.generate).mockResolvedValueOnce(mockGenerateResponse as any);
        renderQuiz();

        await waitFor(() => {
            expect(screen.getByText("An action word")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("An action word")); // wrong answer
        fireEvent.click(screen.getByText("Check"));

        await waitFor(() => {
            expect(screen.getByText("Correct solution:")).toBeInTheDocument();
            expect(
                screen.getByText("A person, place, or thing", {
                    selector: ".pq-correct-answer",
                })
            ).toBeInTheDocument();
        });
    });

    // ── Error state ────────────────────────────────────────────────────────────

    it("shows error message when API fails to load", async () => {
        vi.mocked(placementTestApi.generate).mockRejectedValueOnce(new Error("Network error"));
        renderQuiz();

        await waitFor(() => {
            expect(screen.getByText(/could not load questions/i)).toBeInTheDocument();
        });
    });

    it("shows Try Again button on error", async () => {
        vi.mocked(placementTestApi.generate).mockRejectedValueOnce(new Error("Network error"));
        renderQuiz();

        await waitFor(() => {
            expect(screen.getByText("Try Again")).toBeInTheDocument();
        });
    });

    it("navigates to results when allCompleted error received", async () => {
        vi.mocked(placementTestApi.generate).mockRejectedValueOnce({
            response: { data: { allCompleted: true } },
        });

        renderQuiz();

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(
                "/child/placement/results",
                { replace: true }
            );
        });
    });

    // ── Submit and navigation ──────────────────────────────────────────────────

    it("submits answers and navigates to results when allCompleted is true", async () => {
        vi.mocked(placementTestApi.generate).mockResolvedValueOnce(mockGenerateResponse as any);
        vi.mocked(placementTestApi.submit).mockResolvedValueOnce({
            data: {
                categoryResults: [{ categoryId: "Nouns", score: 90, level: "champion" }],
                allCompleted: true,
                evaluatedCategories: ["Nouns"],
            },
        } as any);

        renderQuiz();

        await waitFor(() => {
            expect(screen.getByText("A person, place, or thing")).toBeInTheDocument();
        });

        // Select answer and check
        fireEvent.click(screen.getByText("A person, place, or thing"));
        fireEvent.click(screen.getByText("Check"));

        await waitFor(() => {
            expect(screen.getByText("Continue")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Continue"));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(
                "/child/placement/results",
                { replace: true }
            );
        });
    });

    it("loads next test when allCompleted is false", async () => {
        vi.mocked(placementTestApi.generate)
            .mockResolvedValueOnce(mockGenerateResponse as any)
            .mockResolvedValueOnce(mockGenerateResponse as any); // second test

        vi.mocked(placementTestApi.submit).mockResolvedValueOnce({
            data: {
                categoryResults: [{ categoryId: "Nouns", score: 60, level: "explorer" }],
                allCompleted: false,  // more tests remain
                evaluatedCategories: ["Nouns"],
            },
        } as any);

        renderQuiz();

        await waitFor(() => {
            expect(screen.getByText("A person, place, or thing")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("A person, place, or thing"));
        fireEvent.click(screen.getByText("Check"));

        await waitFor(() => {
            expect(screen.getByText("Continue")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Continue"));

        // Should call generate again for next test
        await waitFor(() => {
            expect(placementTestApi.generate).toHaveBeenCalledTimes(2);
        });
    });

    // ── Skip ──────────────────────────────────────────────────────────────────

    it("skipping submits a blank answer and moves to next or submits", async () => {
        vi.mocked(placementTestApi.generate).mockResolvedValueOnce(mockGenerateResponse as any);
        vi.mocked(placementTestApi.submit).mockResolvedValueOnce({
            data: {
                categoryResults: [{ categoryId: "Nouns", score: 0, level: "starter" }],
                allCompleted: true,
                evaluatedCategories: ["Nouns"],
            },
        } as any);

        renderQuiz();

        await waitFor(() => {
            expect(screen.getByText("Skip")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Skip"));

        await waitFor(() => {
            expect(placementTestApi.submit).toHaveBeenCalled();
        });

        // Skipped answer should have empty selectedAnswer
        const submitCall = vi.mocked(placementTestApi.submit).mock.calls[0][0];
        expect(submitCall[0].selectedAnswer).toBe("");
    });

    // ── Input type question ────────────────────────────────────────────────────

    it("renders text input for input type questions", async () => {
        vi.mocked(placementTestApi.generate).mockResolvedValueOnce({
            data: {
                questions: [mockInputQuestion],
                categories: ["Adjectives"],
                testNumber: 1,
                totalCategories: 1,
                correctAnswers: { q3: "sky" },
            },
        } as any);

        renderQuiz();

        await waitFor(() => {
            expect(screen.getByPlaceholderText("?")).toBeInTheDocument();
        });
    });

    it("does NOT show option buttons for input type", async () => {
        vi.mocked(placementTestApi.generate).mockResolvedValueOnce({
            data: {
                questions: [mockInputQuestion],
                categories: ["Adjectives"],
                testNumber: 1,
                totalCategories: 1,
                correctAnswers: { q3: "sky" },
            },
        } as any);

        renderQuiz();

        await waitFor(() => {
            expect(screen.getByText("Type the missing word")).toBeInTheDocument();
        });

        // No option buttons should exist (options array is empty for input type)
        const optionButtons = screen.queryAllByRole("button");
        // Only exit, skip, check buttons — no answer option buttons
        expect(optionButtons.length).toBeLessThanOrEqual(3);
    });

});