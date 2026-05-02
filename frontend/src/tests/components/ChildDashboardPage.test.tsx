import { screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ── Mock all API calls ────────────────────────────────────────────────────────
vi.mock("../../features/child/services/quizApi", () => ({
    getDashboardData: vi.fn(),
}));

vi.mock("../../features/child/services/placementTestApi", () => ({
    placementTestApi: {
        getStatus: vi.fn(),
        generate: vi.fn(),
        submit: vi.fn(),
        getResults: vi.fn(),
        reset: vi.fn(),
    },
}));

// ── Mock image assets ─────────────────────────────────────────────────────────
vi.mock("../../../assets/streak.png", () => ({ default: "streak.png" }));
vi.mock("../../../assets/gems.png", () => ({ default: "gems.png" }));
vi.mock("../../../assets/xps.png", () => ({ default: "xps.png" }));

// ── Mock child components not under test ──────────────────────────────────────
vi.mock("../../features/child/components/ChildSidebar", () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock("../../features/child/components/LeaderboardCard", () => ({ default: () => <div data-testid="leaderboard" /> }));
vi.mock("../../features/child/components/DailyQuestCard", () => ({ default: () => <div data-testid="daily-quest" /> }));

// ── Mock useNavigate ──────────────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return { ...actual, useNavigate: () => mockNavigate };
});

// ── Mock useAuth — must come AFTER react-router-dom mock ──────────────────────
vi.mock("../../features/auth/context/AuthContext", () => ({
    useAuth: () => ({
        user: { _id: "child123", name: "Kip", role: "child" },
        login: vi.fn(),
        logout: vi.fn(),
        isAuthenticated: true,
        role: "child",
        loading: false,
        setUser: vi.fn(),
    }),
    AuthProvider: ({ children }: any) => children,
}));

import ChildDashboardPage from "../../features/child/pages/ChildDashboardPage";
import { getDashboardData } from "../../features/child/services/quizApi";
import { placementTestApi } from "../../features/child/services/placementTestApi";

// ── Sample mock data ──────────────────────────────────────────────────────────
const mockStats = { totalXp: 120, streak: 3, gems: 7 };

const mockCategories = [
    { id: "Nouns", name: "Nouns", level: "Starter" as const, icon: "📚", xp: 10, xpToNextLevel: 50, quizzesCompleted: 1 },
    { id: "Verbs", name: "Verbs", level: "Explorer" as const, icon: "🏃", xp: 30, xpToNextLevel: 50, quizzesCompleted: 3 },
    { id: "Adjectives", name: "Adjectives", level: "Champion" as const, icon: "✨", xp: 0, xpToNextLevel: 50, quizzesCompleted: 5 },
];

function renderDashboard() {
    return render(
        <MemoryRouter>
            <ChildDashboardPage />
        </MemoryRouter>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
describe("ChildDashboardPage", () => {

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(placementTestApi.getStatus).mockResolvedValue({
            data: { placementCompleted: true },
        } as any);
        vi.mocked(getDashboardData).mockResolvedValue({
            stats: mockStats,
            categories: mockCategories,
        });
    });


    // ── A) Loading state ──────────────────────────────────────────────────────

    it("shows a loading spinner while fetching data", () => {
        vi.mocked(placementTestApi.getStatus).mockReturnValue(new Promise(() => { }));
        renderDashboard();
        expect(document.querySelector(".MuiCircularProgress-root")).toBeInTheDocument();
    });


    // ── B) Placement redirect ─────────────────────────────────────────────────

    it("redirects to /child/placement when placement is NOT completed", async () => {
        vi.mocked(placementTestApi.getStatus).mockResolvedValue({
            data: { placementCompleted: false },
        } as any);

        renderDashboard();

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/child/placement", { replace: true });
        });
    });

    it("redirects to /child/placement when placement status API fails", async () => {
        vi.mocked(placementTestApi.getStatus).mockRejectedValue(new Error("Network error"));
        renderDashboard();
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/child/placement", { replace: true });
        });
    });

    it("does NOT redirect when placement IS completed", async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText("Nouns")).toBeInTheDocument();
        });
        expect(mockNavigate).not.toHaveBeenCalledWith("/child/placement", expect.anything());
    });


    // ── C) Greeting ───────────────────────────────────────────────────────────

    it("shows a greeting with the child's name from useAuth", async () => {
        renderDashboard();
        await waitFor(() => {
            // greeting shows name from useAuth: "Kip"
            expect(screen.getByText(/kip/i)).toBeInTheDocument();
        });
    });

    it("shows a greeting text on the dashboard", async () => {
        renderDashboard();
        await waitFor(() => {
            // The greeting paragraph exists
            expect(screen.getByText(/ready to learn today/i)).toBeInTheDocument();
        });
    });


    // ── D) TopBarStats — XP, Streak, Gems ────────────────────────────────────

    it("displays the total XP with XP label", async () => {
        renderDashboard();
        await waitFor(() => {
            // XP rendered as "120 XP" — text split across span/text nodes, use regex
            expect(screen.getByText(/120/)).toBeInTheDocument();
        });
    });

    it("displays the streak count", async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByAltText("Streak")).toBeInTheDocument();
            expect(screen.getByText("3")).toBeInTheDocument();
        });
    });

    it("displays the gem count", async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByAltText("Gems")).toBeInTheDocument();
            expect(screen.getByText("7")).toBeInTheDocument();
        });
    });

    it("displays XP image icon", async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByAltText("XP")).toBeInTheDocument();
        });
    });

    it("shows 0 XP when totalXp is zero", async () => {
        vi.mocked(getDashboardData).mockResolvedValue({
            stats: { totalXp: 0, streak: 0, gems: 0 },
            categories: [],
        });
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText(/0\s*XP/)).toBeInTheDocument();
        });
    });

    it("shows large XP values correctly", async () => {
        vi.mocked(getDashboardData).mockResolvedValue({
            stats: { totalXp: 9999, streak: 30, gems: 150 },
            categories: [],
        });
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText(/9999/)).toBeInTheDocument();
        });
    });


    // ── E) Category Grid ──────────────────────────────────────────────────────

    it("renders all category cards", async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText("Nouns")).toBeInTheDocument();
            expect(screen.getByText("Verbs")).toBeInTheDocument();
            expect(screen.getByText("Adjectives")).toBeInTheDocument();
        });
    });

    it("shows correct level label on each category card", async () => {
        renderDashboard();
        await waitFor(() => {
            // CSS textTransform uppercase is NOT applied in jsdom — check raw values
            expect(screen.getByText("Starter")).toBeInTheDocument();
            expect(screen.getByText("Explorer")).toBeInTheDocument();
            expect(screen.getByText("Champion")).toBeInTheDocument();
        });
    });

    it("shows correct XP for each category", async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText(/XP.*10|10.*XP/)).toBeInTheDocument();
            expect(screen.getByText(/XP.*30|30.*XP/)).toBeInTheDocument();
        });
    });

    it("shows category icons", async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText("📚")).toBeInTheDocument();
            expect(screen.getByText("🏃")).toBeInTheDocument();
            expect(screen.getByText("✨")).toBeInTheDocument();
        });
    });

    it("shows empty state message when no categories", async () => {
        vi.mocked(getDashboardData).mockResolvedValue({
            stats: mockStats,
            categories: [],
        });
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText(/start learning|no categories/i)).toBeInTheDocument();
        });
    });


    // ── F) Category click navigation ──────────────────────────────────────────

    it("navigates to category progress page when Nouns is clicked", async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText("Nouns")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText("Nouns"));
        expect(mockNavigate).toHaveBeenCalledWith("/child/category-progress/Nouns");
    });

    it("navigates to correct page when Verbs is clicked", async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText("Verbs")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText("Verbs"));
        expect(mockNavigate).toHaveBeenCalledWith("/child/category-progress/Verbs");
    });

    it("navigates to correct page when Adjectives is clicked", async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText("Adjectives")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText("Adjectives"));
        expect(mockNavigate).toHaveBeenCalledWith("/child/category-progress/Adjectives");
    });


    // ── G) Sidebar and widgets ────────────────────────────────────────────────

    it("renders the sidebar", async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByTestId("sidebar")).toBeInTheDocument();
        });
    });

    it("renders the leaderboard widget", async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByTestId("leaderboard")).toBeInTheDocument();
        });
    });

    it("renders the daily quest widget", async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByTestId("daily-quest")).toBeInTheDocument();
        });
    });


    // ── H) API call verification ──────────────────────────────────────────────

    it("calls getDashboardData once after placement confirmed", async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText("Nouns")).toBeInTheDocument();
        });
        expect(getDashboardData).toHaveBeenCalledTimes(1);
    });

    it("calls placementTestApi.getStatus once on mount", async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText("Nouns")).toBeInTheDocument();
        });
        expect(placementTestApi.getStatus).toHaveBeenCalledTimes(1);
    });


    // ── I) Single category ────────────────────────────────────────────────────

    it("renders correctly with only one category", async () => {
        vi.mocked(getDashboardData).mockResolvedValue({
            stats: mockStats,
            categories: [
                { id: "Nouns", name: "Nouns", level: "Starter" as const, icon: "📚", xp: 5, xpToNextLevel: 50, quizzesCompleted: 0 },
            ],
        });
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText("Nouns")).toBeInTheDocument();
            // CSS textTransform uppercase not applied in jsdom
            expect(screen.getByText("Starter")).toBeInTheDocument();
        });
    });

});