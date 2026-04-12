import { screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders } from "../helpers/renderWithProviders";
import ParentSignupPage from "../../features/auth/pages/ParentSignupPage";

vi.mock("../../features/auth/api/authApi", () => ({
    parentSignup: vi.fn(),
    googleSignup: vi.fn(),
}));

const mockLogin = vi.fn();
vi.mock("../../features/auth/context/AuthContext", () => ({
    useAuth: () => ({
        login: mockLogin,
        user: null,
        isAuthenticated: false,
        role: null,
        loading: false,
        logout: vi.fn(),
        setUser: vi.fn(),
    }),
    AuthProvider: ({ children }: any) => children,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ state: null, pathname: "/auth/signup" }),
    };
});

import { parentSignup } from "../../features/auth/api/authApi";

describe("ParentSignupPage", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Rendering ──────────────────────────────────────────────────────────────

    it("renders the signup form correctly", () => {
        renderWithProviders(<ParentSignupPage />);

        expect(screen.getByText("Create Parent Account")).toBeInTheDocument();
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
    });

    it("renders the Google signup button", () => {
        renderWithProviders(<ParentSignupPage />);
        expect(screen.getByText(/sign up with google/i)).toBeInTheDocument();
    });

    it("renders the terms checkbox", () => {
        renderWithProviders(<ParentSignupPage />);
        expect(screen.getByText(/terms of service/i)).toBeInTheDocument();
    });

    it("renders the guardian confirmation checkbox", () => {
        renderWithProviders(<ParentSignupPage />);
        expect(screen.getByText(/parent or legal guardian/i)).toBeInTheDocument();
    });

    it("renders the login link for existing users", () => {
        renderWithProviders(<ParentSignupPage />);
        expect(screen.getByText(/log in/i)).toBeInTheDocument();
    });

    // ── Form Interaction ───────────────────────────────────────────────────────

    it("updates all fields when typed into", () => {
        renderWithProviders(<ParentSignupPage />);

        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Jane Doe" } });
        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "jane@test.com" } });
        fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "Password123!" } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "Password123!" } });

        expect(screen.getByLabelText(/full name/i)).toHaveValue("Jane Doe");
        expect(screen.getByLabelText(/email address/i)).toHaveValue("jane@test.com");
    });

    // ── Validation ─────────────────────────────────────────────────────────────

    it("shows error if terms not accepted", async () => {
        renderWithProviders(<ParentSignupPage />);

        // Fill in fields but don't check boxes
        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Jane" } });
        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "jane@test.com" } });
        fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "Password123!" } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "Password123!" } });

        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        await waitFor(() => {
            expect(screen.getByText(/please accept the terms/i)).toBeInTheDocument();
        });
    });

    // ── Successful Signup ──────────────────────────────────────────────────────

    it("calls parentSignup and navigates to verify email on success", async () => {
        const mockParentSignup = vi.mocked(parentSignup);
        mockParentSignup.mockResolvedValueOnce({
            message: "Account created! Check your email.",
            user: { _id: "1", name: "Jane", email: "jane@test.com", role: "parent", emailVerified: false },
        });

        renderWithProviders(<ParentSignupPage />);

        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Jane" } });
        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "jane@test.com" } });
        fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "Password123!" } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "Password123!" } });

        // Check both checkboxes
        const checkboxes = screen.getAllByRole("checkbox");
        fireEvent.click(checkboxes[0]);
        fireEvent.click(checkboxes[1]);

        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        await waitFor(() => {
            expect(mockParentSignup).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith(
                "/auth/verify-email",
                expect.objectContaining({ state: { email: "jane@test.com" } }),
            );
        });
    });

    // ── Error Handling ─────────────────────────────────────────────────────────

    it("shows error message when signup fails", async () => {
        const mockParentSignup = vi.mocked(parentSignup);
        mockParentSignup.mockRejectedValueOnce({
            response: { data: { message: "An account with this email already exists" } },
        });

        renderWithProviders(<ParentSignupPage />);

        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Jane" } });
        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "jane@test.com" } });
        fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "Password123!" } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "Password123!" } });

        const checkboxes = screen.getAllByRole("checkbox");
        fireEvent.click(checkboxes[0]);
        fireEvent.click(checkboxes[1]);

        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        await waitFor(() => {
            expect(screen.getByText("An account with this email already exists")).toBeInTheDocument();
        });
    });

});