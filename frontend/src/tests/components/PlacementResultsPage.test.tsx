import { screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../features/child/services/placementTestApi", () => ({
    placementTestApi: {
        getResults: vi.fn(),
        generate: vi.fn(),
        submit: vi.fn(),
        reset: vi.fn(),
        getStatus: vi.fn(),
    },
}));

vi.mock("../../features/child/pages/PlacementResults.css", () => ({}));
vi.mock("../../../assets/kip.png", () => ({ default: "kip.png" }));

const mockLogin = vi.fn();
vi.mock("../../features/auth/context/AuthContext", () => ({
    useAuth: () => ({
        user: { _id: "child123", name: "Test Child", role: "child" },
        login: mockLogin,
        isAuthenticated: true,
        role: "child",
        loading: false,
        logout: vi.fn(),
        setUser: vi.fn(),
    }),
    AuthProvider: ({ children }: any) => children,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return { ...actual, useNavigate: () => mockNavigate };
});

import PlacementResultsPage from "../../features/child/pages/PlacementResultsPage";
import { placementTestApi } from "../../features/child/services/placementTestApi";

const mockResults = {
    data: {
        categoryResults: [
            { categoryId: "Nouns", score: 90, level: "champion" as const },
            { categoryId: "Verbs", score: 55, level: "explorer" as const },
            { categoryId: "Pronouns", score: 30, level: "starter" as const },
        ],
        evaluatedCategories: ["Nouns", "Verbs", "Pronouns"],
        placementCompleted: true,
    },
};

function renderResults() {
    return render(
        <MemoryRouter>
            <PlacementResultsPage />
        </MemoryRouter>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
describe("PlacementResultsPage", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Loading ────────────────────────────────────────────────────────────────

    it("shows loading spinner while fetching results", () => {
        vi.mocked(placementTestApi.getResults).mockReturnValue(new Promise(() => {}));
        renderResults();
        expect(screen.getByText(/calculating your results/i)).toBeInTheDocument();
    });

    // ── Results rendering ──────────────────────────────────────────────────────

    it("shows Great Job heading after results load", async () => {
        vi.mocked(placementTestApi.getResults).mockResolvedValueOnce(mockResults as any);
        renderResults();

        await waitFor(() => {
            expect(screen.getByText(/great job/i)).toBeInTheDocument();
        });
    });

    it("renders a card for each category result", async () => {
        vi.mocked(placementTestApi.getResults).mockResolvedValueOnce(mockResults as any);
        renderResults();

        await waitFor(() => {
            expect(screen.getByText("Nouns")).toBeInTheDocument();
            expect(screen.getByText("Verbs")).toBeInTheDocument();
            expect(screen.getByText("Pronouns")).toBeInTheDocument();
        });
    });

    it("shows correct score for each category", async () => {
        vi.mocked(placementTestApi.getResults).mockResolvedValueOnce(mockResults as any);
        renderResults();

        await waitFor(() => {
            expect(screen.getByText("90%")).toBeInTheDocument();
            expect(screen.getByText("55%")).toBeInTheDocument();
            expect(screen.getByText("30%")).toBeInTheDocument();
        });
    });

    it("shows correct level labels", async () => {
        vi.mocked(placementTestApi.getResults).mockResolvedValueOnce(mockResults as any);
        renderResults();

        await waitFor(() => {
            expect(screen.getByText("Champion")).toBeInTheDocument();
            expect(screen.getByText("Explorer")).toBeInTheDocument();
            expect(screen.getByText("Starter")).toBeInTheDocument();
        });
    });

    it("shows correct emoji for each level", async () => {
        vi.mocked(placementTestApi.getResults).mockResolvedValueOnce(mockResults as any);
        renderResults();

        await waitFor(() => {
            expect(screen.getByText("🏆")).toBeInTheDocument(); // champion
            expect(screen.getByText("🔍")).toBeInTheDocument(); // explorer
            expect(screen.getByText("🌱")).toBeInTheDocument(); // starter
        });
    });

    it("shows Continue to Dashboard button", async () => {
        vi.mocked(placementTestApi.getResults).mockResolvedValueOnce(mockResults as any);
        renderResults();

        await waitFor(() => {
            expect(screen.getByText(/continue to dashboard/i)).toBeInTheDocument();
        });
    });

    // ── Navigation ─────────────────────────────────────────────────────────────

    it("navigates to child dashboard when Continue is clicked", async () => {
        vi.mocked(placementTestApi.getResults).mockResolvedValueOnce(mockResults as any);
        renderResults();

        await waitFor(() => {
            expect(screen.getByText(/continue to dashboard/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/continue to dashboard/i));

        expect(mockNavigate).toHaveBeenCalledWith("/child/dashboard", { replace: true });
    });

    it("sets placementDone in localStorage when Continue is clicked", async () => {
        vi.mocked(placementTestApi.getResults).mockResolvedValueOnce(mockResults as any);
        const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

        renderResults();

        await waitFor(() => {
            expect(screen.getByText(/continue to dashboard/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/continue to dashboard/i));

        expect(setItemSpy).toHaveBeenCalledWith(
            "placementDone_child123",
            "true"
        );
    });

    // ── Error / empty state ────────────────────────────────────────────────────

    it("shows empty results gracefully when no categories returned", async () => {
        vi.mocked(placementTestApi.getResults).mockResolvedValueOnce({
            data: {
                categoryResults: [],
                evaluatedCategories: [],
                placementCompleted: false,
            },
        } as any);

        renderResults();

        await waitFor(() => {
            // No category cards but page still renders
            expect(screen.getByText(/great job/i)).toBeInTheDocument();
        });
    });

    it("renders without crashing when API fails", async () => {
        vi.mocked(placementTestApi.getResults).mockRejectedValueOnce(new Error("API error"));
        renderResults();

        // Should not crash — just show empty state
        await waitFor(() => {
            expect(screen.queryByText(/calculating/i)).not.toBeInTheDocument();
        });
    });

});