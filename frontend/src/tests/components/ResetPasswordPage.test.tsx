import { screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders } from "../helpers/renderWithProviders";
import ResetPasswordPage from "../../features/auth/pages/ResetPasswordPage";

vi.mock("../../features/auth/api/authApi", () => ({
    resetPassword: vi.fn(),
}));

vi.mock("../../features/auth/context/AuthContext", () => ({
    useAuth: () => ({
        login: vi.fn(),
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
        useLocation: () => ({ state: { email: "parent@test.com" }, pathname: "/auth/reset-password" }),
    };
});

import { resetPassword } from "../../features/auth/api/authApi";

describe("ResetPasswordPage", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Rendering ──────────────────────────────────────────────────────────────

    it("renders reset password form correctly", () => {
    renderWithProviders(<ResetPasswordPage />);

    // Use heading role to be specific — not getByText which matches both heading and button
    expect(screen.getByRole("heading", { name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/6-digit reset code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset password/i })).toBeInTheDocument();
});

    it("pre-fills email from location state", () => {
        renderWithProviders(<ResetPasswordPage />);
        expect(screen.getByLabelText(/email/i)).toHaveValue("parent@test.com");
    });

    it("renders back to login link", () => {
        renderWithProviders(<ResetPasswordPage />);
        expect(screen.getByText(/back to login/i)).toBeInTheDocument();
    });

    // ── Form interaction ───────────────────────────────────────────────────────

    it("can fill in all form fields", () => {
        renderWithProviders(<ResetPasswordPage />);

        fireEvent.change(screen.getByLabelText(/6-digit reset code/i), { target: { value: "123456" } });
        fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "NewPass123!" } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "NewPass123!" } });

        expect(screen.getByLabelText(/6-digit reset code/i)).toHaveValue("123456");
        expect(screen.getByLabelText(/new password/i)).toHaveValue("NewPass123!");
    });

    // ── Successful Reset ───────────────────────────────────────────────────────

    it("calls resetPassword and navigates to login on success", async () => {
        const mockReset = vi.mocked(resetPassword);
        mockReset.mockResolvedValueOnce({ message: "Password has been reset. Please log in." });

        renderWithProviders(<ResetPasswordPage />);

        fireEvent.change(screen.getByLabelText(/6-digit reset code/i), { target: { value: "123456" } });
        fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "NewPass123!" } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "NewPass123!" } });

        fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

        await waitFor(() => {
            expect(mockReset).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith(
                "/auth/login",
                expect.objectContaining({ state: { resetSuccess: true } }),
            );
        });
    });

    // ── Error Handling ─────────────────────────────────────────────────────────

    it("shows error message when reset fails", async () => {
        const mockReset = vi.mocked(resetPassword);
        mockReset.mockRejectedValueOnce({
            response: { data: { message: "Invalid reset code" } },
        });

        renderWithProviders(<ResetPasswordPage />);

        fireEvent.change(screen.getByLabelText(/6-digit reset code/i), { target: { value: "999999" } });
        fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "NewPass123!" } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "NewPass123!" } });

        fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

        await waitFor(() => {
            expect(screen.getByText("Invalid reset code")).toBeInTheDocument();
        });
    });

    it("clears error when user types again after failure", async () => {
        const mockReset = vi.mocked(resetPassword);
        mockReset.mockRejectedValueOnce({
            response: { data: { message: "Invalid reset code" } },
        });

        renderWithProviders(<ResetPasswordPage />);

        fireEvent.change(screen.getByLabelText(/6-digit reset code/i), { target: { value: "999999" } });
        fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "NewPass123!" } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "NewPass123!" } });
        fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

        await waitFor(() => {
            expect(screen.getByText("Invalid reset code")).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText(/6-digit reset code/i), { target: { value: "1" } });
        expect(screen.queryByText("Invalid reset code")).not.toBeInTheDocument();
    });

});