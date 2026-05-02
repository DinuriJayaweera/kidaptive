import { screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ── CSS mock must be first ────────────────────────────────────────────────────
vi.mock("../../features/child/pages/PlacementQuiz.css", () => ({}));

// ── Declare mock functions upfront so they can be controlled ─────────────────
const { mockGenerate, mockSubmit, mockGetStatus, mockGetResults, mockReset } = vi.hoisted(() => ({
    mockGenerate: vi.fn(),
    mockSubmit: vi.fn(),
    mockGetStatus: vi.fn(),
    mockGetResults: vi.fn(),
    mockReset: vi.fn(),
}));

vi.mock("../../features/child/services/placementTestApi", () => ({
    placementTestApi: {
        generate: mockGenerate,
        submit: mockSubmit,
        getStatus: mockGetStatus,
        getResults: mockGetResults,
        reset: mockReset,
    },
}));

// ── Mock useNavigate ──────────────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return { ...actual, useNavigate: () => mockNavigate };
});

import PlacementQuizPage from "../../features/child/pages/PlacementQuizPage";

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

const mockStatusNotCompleted = {
    data: {
        placementCompleted: false,
        totalCategories: 1,
        evaluatedCategories: [],
        remainingCategories: ["Nouns"],
    },
};

const mockStatusCompleted = {
    data: { placementCompleted: true },
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
        // Default: placement not completed, questions load successfully
        mockGetStatus.mockResolvedValue(mockStatusNotCompleted);
        mockGenerate.mockResolvedValue(mockGenerateResponse);
        mockSubmit.mockResolvedValue({
            data: {
                categoryResults: [{ categoryId: "Nouns", score: 90, level: "champion" }],
                allCompleted: true,
                evaluatedCategories: ["Nouns"],
            },
        });
    });


    // ── Loading ───────────────────────────────────────────────────────────────

    it("shows loading text while fetching questions", () => {
        mockGetStatus.mockReturnValue(new Promise(() => { }));
        renderQuiz();
        // Either loading spinner or loading text
        expect(
            document.querySelector(".MuiCircularProgress-root") ||
            screen.queryByText(/loading/i)
        ).toBeTruthy();
    });


    // ── Redirect when already completed ───────────────────────────────────────

    it("redirects to /child/dashboard when placement is already completed", async () => {
        mockGetStatus.mockResolvedValue(mockStatusCompleted);
        renderQuiz();
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(
                "/child/dashboard",
                { replace: true },
            );
        });
    });


    // ── MCQ question rendering ────────────────────────────────────────────────

    it("renders MCQ question text after loading", async () => {
        renderQuiz();
        await waitFor(() => {
            expect(screen.getByText("What is a noun?")).toBeInTheDocument();
        });
    });

    it("renders all 4 MCQ options", async () => {
        renderQuiz();
        await waitFor(() => {
            expect(screen.getByText("A person, place, or thing")).toBeInTheDocument();
            expect(screen.getByText("An action word")).toBeInTheDocument();
            expect(screen.getByText("A describing word")).toBeInTheDocument();
            expect(screen.getByText("A connecting word")).toBeInTheDocument();
        });
    });

    it("shows 'Choose the correct answer' title for MCQ", async () => {
        renderQuiz();
        await waitFor(() => {
            expect(screen.getByText(/choose the correct answer/i)).toBeInTheDocument();
        });
    });

    it("shows question counter 1/1", async () => {
        renderQuiz();
        await waitFor(() => {
            expect(screen.getByText("1/1")).toBeInTheDocument();
        });
    });


    // ── Fill question rendering ───────────────────────────────────────────────

    it("shows 'Fill in the blank' title for fill type question", async () => {
        mockGenerate.mockResolvedValue({
            data: {
                ...mockGenerateResponse.data,
                questions: [mockFillQuestion],
                correctAnswers: { q2: "runs" },
            },
        });
        renderQuiz();
        await waitFor(() => {
            expect(screen.getByText(/fill in the blank/i)).toBeInTheDocument();
        });
    });


    // ── Input question rendering ──────────────────────────────────────────────

    it("shows 'Type the missing word' title for input type question", async () => {
        mockGenerate.mockResolvedValue({
            data: {
                ...mockGenerateResponse.data,
                questions: [mockInputQuestion],
                correctAnswers: { q3: "sky" },
            },
        });
        renderQuiz();
        await waitFor(() => {
            expect(screen.getByRole("heading", { name: /type the missing word/i })).toBeInTheDocument();
        });
    });

    it("renders text input field for input type question", async () => {
        mockGenerate.mockResolvedValue({
            data: {
                ...mockGenerateResponse.data,
                questions: [mockInputQuestion],
                correctAnswers: { q3: "sky" },
            },
        });
        renderQuiz();
        await waitFor(() => {
            const input = screen.queryByRole("textbox");
            expect(input).toBeInTheDocument();
        });
    });


    // ── Boolean question rendering ────────────────────────────────────────────

    it("shows 'True or False?' title for boolean type question", async () => {
        mockGenerate.mockResolvedValue({
            data: {
                ...mockGenerateResponse.data,
                questions: [mockBooleanQuestion],
                correctAnswers: { q4: "True" },
            },
        });
        renderQuiz();
        await waitFor(() => {
            expect(screen.getByText(/true or false/i)).toBeInTheDocument();
        });
    });


    // ── Skip and Check buttons ────────────────────────────────────────────────

    it("shows Skip and Check buttons", async () => {
        renderQuiz();
        await waitFor(() => {
            expect(screen.getByText(/skip/i)).toBeInTheDocument();
            expect(screen.getByText(/check/i)).toBeInTheDocument();
        });
    });

    it("Check button is disabled when no answer selected", async () => {
        renderQuiz();
        await waitFor(() => {
            const checkBtn = screen.getByText(/check/i);
            expect(checkBtn.closest("button")).toBeDisabled();
        });
    });

    it("Check button is enabled after selecting an answer", async () => {
        renderQuiz();
        await waitFor(() => {
            expect(screen.getByText("A person, place, or thing")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText("A person, place, or thing"));
        const checkBtn = screen.getByText(/check/i);
        expect(checkBtn.closest("button")).not.toBeDisabled();
    });


    // ── Correct answer feedback ───────────────────────────────────────────────

    it("shows 'Amazing!' feedback when correct answer selected", async () => {
        renderQuiz();
        await waitFor(() => {
            expect(screen.getByText("A person, place, or thing")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText("A person, place, or thing"));
        fireEvent.click(screen.getByText(/check/i));
        await waitFor(() => {
            expect(screen.getByText(/amazing/i)).toBeInTheDocument();
        });
    });

    it("shows Continue button after correct answer", async () => {
        renderQuiz();
        await waitFor(() => {
            expect(screen.getByText("A person, place, or thing")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText("A person, place, or thing"));
        fireEvent.click(screen.getByText(/check/i));
        await waitFor(() => {
            expect(screen.getByText(/continue/i)).toBeInTheDocument();
        });
    });


    // ── Wrong answer feedback ─────────────────────────────────────────────────

    it("shows 'Correct solution:' when wrong answer selected", async () => {
        renderQuiz();
        await waitFor(() => {
            expect(screen.getByText("An action word")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText("An action word")); // wrong answer
        fireEvent.click(screen.getByText(/check/i));
        await waitFor(() => {
            expect(screen.getByText(/correct solution/i)).toBeInTheDocument();
        });
    });

    it("shows the correct answer after wrong selection", async () => {
        renderQuiz();
        await waitFor(() => {
            expect(screen.getByText("An action word")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText("An action word"));
        fireEvent.click(screen.getByText(/check/i));
        await waitFor(() => {
            expect(screen.getAllByText("A person, place, or thing").length).toBeGreaterThan(0);
        });
    });


    // ── Error state ───────────────────────────────────────────────────────────

    it("shows error message when API fails to load", async () => {
        mockGenerate.mockRejectedValue(new Error("Network error"));
        renderQuiz();
        await waitFor(() => {
            expect(screen.getByText(/could not load questions/i)).toBeInTheDocument();
        });
    });

    it("shows Try Again button on error", async () => {
        mockGenerate.mockRejectedValue(new Error("Network error"));
        renderQuiz();
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
        });
    });

    it("navigates to results when allCompleted is in error response", async () => {
        mockGenerate.mockRejectedValue({
            response: { data: { allCompleted: true } },
        });
        renderQuiz();
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(
                "/child/placement/results",
                { replace: true },
            );
        });
    });


    // ── Submit and navigation ─────────────────────────────────────────────────

    it("navigates to results when allCompleted=true after submit", async () => {
        renderQuiz();
        await waitFor(() => {
            expect(screen.getByText("A person, place, or thing")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText("A person, place, or thing"));
        fireEvent.click(screen.getByText(/check/i));
        await waitFor(() => {
            expect(screen.getByText(/continue/i)).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText(/continue/i));
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(
                "/child/placement/results",
                { replace: true },
            );
        });
    });

    it("loads next test when allCompleted=false after submit", async () => {
        mockSubmit.mockResolvedValue({
            data: {
                categoryResults: [{ categoryId: "Nouns", score: 60, level: "explorer" }],
                allCompleted: false,
                evaluatedCategories: ["Nouns"],
            },
        });
        // Second generate call for next test
        mockGenerate
            .mockResolvedValueOnce(mockGenerateResponse)
            .mockResolvedValueOnce(mockGenerateResponse);

        renderQuiz();
        await waitFor(() => {
            expect(screen.getByText("A person, place, or thing")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText("A person, place, or thing"));
        fireEvent.click(screen.getByText(/check/i));
        await waitFor(() => {
            expect(screen.getByText(/continue/i)).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText(/continue/i));
        await waitFor(() => {
            expect(mockGenerate).toHaveBeenCalledTimes(2);
        });
    });


    // ── Skip ──────────────────────────────────────────────────────────────────

    it("skipping submits blank answer when it is the last question", async () => {
        renderQuiz();
        await waitFor(() => {
            expect(screen.getByText(/skip/i)).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText(/skip/i));
        await waitFor(() => {
            expect(mockSubmit).toHaveBeenCalled();
        });
        const submitCall = mockSubmit.mock.calls[0][0];
        expect(submitCall[0].selectedAnswer).toBe("");
    });

});