import { screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ── CSS mocks ────────────────────────────────────────────────────────────────
vi.mock("../../features/child/pages/AdaptiveQuiz.css", () => ({}));
vi.mock("../../features/child/pages/PlacementQuiz.css", () => ({}));

// ── Asset mocks ───────────────────────────────────────────────────────────────
vi.mock("../../assets/xps.png", () => ({ default: "xps.png" }));
vi.mock("../../assets/gems.png", () => ({ default: "gems.png" }));
vi.mock("../../assets/kip.png", () => ({ default: "kip.png" }));
vi.mock("../../assets/kip_a.png", () => ({ default: "kip_a.png" }));
vi.mock("../../assets/star.png", () => ({ default: "star.png" }));

// ── API mock ─────────────────────────────────────────────────────────────────
const { mockStart, mockSubmit } = vi.hoisted(() => ({
    mockStart: vi.fn(),
    mockSubmit: vi.fn(),
}));

vi.mock("../../features/child/services/childDailyQuestApi", () => ({
    startDailyQuest: mockStart,
    submitDailyQuest: mockSubmit,
}));

// ── navigate mock ─────────────────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return { ...actual, useNavigate: () => mockNavigate };
});

import DailyQuestPage from "../../features/child/pages/DailyQuestPage";

// ── Sample data ───────────────────────────────────────────────────────────────

const mcqQuestion = {
    _id: "q1",
    questionText: "Which word is a noun?",
    type: "mcq" as const,
    category: "Nouns",
    difficulty: "easy" as const,
    options: ["Dog", "Run", "Blue", "Quickly"],
};

const inputQuestion = {
    _id: "q2",
    questionText: "Type the animal: A ____ says meow.",
    type: "input" as const,
    category: "Animals",
    difficulty: "easy" as const,
    options: [],
};

const successStart = {
    questions: [mcqQuestion],
    correctAnswers: { q1: "Dog" },
    totalQuestions: 1,
};

const successSubmit = {
    score: 100,
    passed: true,
    correctCount: 1,
    totalQuestions: 1,
    xpEarned: 20,
    gemsEarned: 150,
    totalXP: 20,
    totalGems: 150,
};

function renderPage() {
    return render(
        <MemoryRouter>
            <DailyQuestPage />
        </MemoryRouter>
    );
}

// ═════════════════════════════════════════════════════════════════════════════

describe("DailyQuestPage", () => {

    beforeEach(() => {
        vi.clearAllMocks();
        mockStart.mockResolvedValue(successStart);
        mockSubmit.mockResolvedValue(successSubmit);
    });

    // ── Loading state ────────────────────────────────────────────────────────

    it("shows loading spinner while fetching questions", () => {
        mockStart.mockReturnValue(new Promise(() => {}));
        renderPage();
        expect(
            document.querySelector(".aq-loading") ||
            screen.queryByText(/preparing/i)
        ).toBeTruthy();
    });

    // ── Error states ─────────────────────────────────────────────────────────

    it("shows '409 already completed' message when API returns 409", async () => {
        mockStart.mockRejectedValue({ response: { status: 409 } });
        renderPage();
        await waitFor(() => {
            expect(screen.getByText(/already completed today/i)).toBeInTheDocument();
        });
    });

    it("shows generic error message on other API failures", async () => {
        mockStart.mockRejectedValue(new Error("Network error"));
        renderPage();
        await waitFor(() => {
            expect(screen.getByText(/could not load/i)).toBeInTheDocument();
        });
    });

    it("shows 'Back to Dashboard' button on error", async () => {
        mockStart.mockRejectedValue(new Error("fail"));
        renderPage();
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /back to dashboard/i })).toBeInTheDocument();
        });
    });

    it("navigates to /child/dashboard when 'Back to Dashboard' is clicked", async () => {
        mockStart.mockRejectedValue(new Error("fail"));
        renderPage();
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /back to dashboard/i })).toBeInTheDocument();
        });
        fireEvent.click(screen.getByRole("button", { name: /back to dashboard/i }));
        expect(mockNavigate).toHaveBeenCalledWith("/child/dashboard", { replace: true });
    });

    // ── MCQ question rendering ───────────────────────────────────────────────

    it("renders MCQ question text after loading", async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByText("Which word is a noun?")).toBeInTheDocument();
        });
    });

    it("renders all MCQ options", async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByText("Dog")).toBeInTheDocument();
            expect(screen.getByText("Run")).toBeInTheDocument();
            expect(screen.getByText("Blue")).toBeInTheDocument();
            expect(screen.getByText("Quickly")).toBeInTheDocument();
        });
    });

    it("shows question counter 1/1", async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByText(/1\/1/)).toBeInTheDocument();
        });
    });

    // ── Input question rendering ─────────────────────────────────────────────

    it("renders text input for 'input' type question", async () => {
        mockStart.mockResolvedValue({
            questions: [inputQuestion],
            correctAnswers: { q2: "cat" },
            totalQuestions: 1,
        });
        renderPage();
        await waitFor(() => {
            expect(screen.getByRole("textbox")).toBeInTheDocument();
        });
    });

    // ── Check / Skip buttons ─────────────────────────────────────────────────

    it("shows Skip and Check buttons", async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByText(/skip/i)).toBeInTheDocument();
            expect(screen.getByText(/check/i)).toBeInTheDocument();
        });
    });

    it("Check button is disabled before selecting an answer", async () => {
        renderPage();
        await waitFor(() => {
            const btn = screen.getByText(/check/i).closest("button");
            expect(btn).toBeDisabled();
        });
    });

    it("Check button becomes enabled after selecting an answer", async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByText("Dog")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText("Dog"));
        expect(screen.getByText(/check/i).closest("button")).not.toBeDisabled();
    });

    // ── Correct answer flow ──────────────────────────────────────────────────

    it("shows positive feedback after selecting correct answer", async () => {
        renderPage();
        await waitFor(() => { expect(screen.getByText("Dog")).toBeInTheDocument(); });
        fireEvent.click(screen.getByText("Dog"));
        fireEvent.click(screen.getByText(/check/i));
        await waitFor(() => {
            expect(screen.getByText(/amazing/i)).toBeInTheDocument();
        });
    });

    it("shows Continue button after answering correctly", async () => {
        renderPage();
        await waitFor(() => { expect(screen.getByText("Dog")).toBeInTheDocument(); });
        fireEvent.click(screen.getByText("Dog"));
        fireEvent.click(screen.getByText(/check/i));
        await waitFor(() => {
            expect(screen.getByText(/continue/i)).toBeInTheDocument();
        });
    });

    // ── Wrong answer flow ────────────────────────────────────────────────────

    it("shows 'Correct solution' feedback after selecting wrong answer", async () => {
        renderPage();
        await waitFor(() => { expect(screen.getByText("Run")).toBeInTheDocument(); });
        fireEvent.click(screen.getByText("Run")); // wrong
        fireEvent.click(screen.getByText(/check/i));
        await waitFor(() => {
            expect(screen.getByText(/correct solution/i)).toBeInTheDocument();
        });
    });

    // ── Skip flow ────────────────────────────────────────────────────────────

    it("calls submitDailyQuest with empty selectedAnswer when Skip is clicked on last question", async () => {
        renderPage();
        await waitFor(() => { expect(screen.getByText(/skip/i)).toBeInTheDocument(); });
        fireEvent.click(screen.getByText(/skip/i));
        await waitFor(() => {
            expect(mockSubmit).toHaveBeenCalled();
        });
        const [answers] = mockSubmit.mock.calls[0] as any[];
        expect(answers[0].selectedAnswer).toBe("");
    });

    // ── Result screen ────────────────────────────────────────────────────────

    it("shows result screen with score after completing all questions", async () => {
        renderPage();
        await waitFor(() => { expect(screen.getByText("Dog")).toBeInTheDocument(); });
        fireEvent.click(screen.getByText("Dog"));
        fireEvent.click(screen.getByText(/check/i));
        await waitFor(() => { expect(screen.getByText(/continue/i)).toBeInTheDocument(); });
        fireEvent.click(screen.getByText(/continue/i));
        await waitFor(() => {
            expect(screen.getByText(/100/)).toBeInTheDocument();
        });
    });

    it("shows XP and gems earned on the result screen", async () => {
        renderPage();
        await waitFor(() => { expect(screen.getByText("Dog")).toBeInTheDocument(); });
        fireEvent.click(screen.getByText("Dog"));
        fireEvent.click(screen.getByText(/check/i));
        await waitFor(() => { expect(screen.getByText(/continue/i)).toBeInTheDocument(); });
        fireEvent.click(screen.getByText(/continue/i));
        await waitFor(() => {
            // +150 gems is unique; XP label confirms reward section rendered
            expect(screen.getByText(/\+150/)).toBeInTheDocument();
            expect(screen.getByText(/XP Earned/i)).toBeInTheDocument();
        });
    });

    it("shows pass title on result when score >= 75", async () => {
        renderPage();
        await waitFor(() => { expect(screen.getByText("Dog")).toBeInTheDocument(); });
        fireEvent.click(screen.getByText("Dog"));
        fireEvent.click(screen.getByText(/check/i));
        await waitFor(() => { expect(screen.getByText(/continue/i)).toBeInTheDocument(); });
        fireEvent.click(screen.getByText(/continue/i));
        await waitFor(() => {
            expect(screen.getByText(/amazing quest/i)).toBeInTheDocument();
        });
    });

    it("shows fail title on result when score < 75", async () => {
        mockSubmit.mockResolvedValue({
            score: 60,
            passed: false,
            correctCount: 6,
            totalQuestions: 10,
            xpEarned: 12,
            gemsEarned: 60,
            totalXP: 12,
            totalGems: 60,
        });
        renderPage();
        await waitFor(() => { expect(screen.getByText("Dog")).toBeInTheDocument(); });
        fireEvent.click(screen.getByText("Dog")); // any answer to trigger submit
        fireEvent.click(screen.getByText(/check/i));
        await waitFor(() => { expect(screen.getByText(/continue/i)).toBeInTheDocument(); });
        fireEvent.click(screen.getByText(/continue/i));
        await waitFor(() => {
            expect(screen.getByText(/good effort/i)).toBeInTheDocument();
        });
    });
});
