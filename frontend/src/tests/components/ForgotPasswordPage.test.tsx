import { screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders } from "../helpers/renderWithProviders";
import ForgotPasswordPage from "../../features/auth/pages/ForgotPasswordPage";

vi.mock("../../features/auth/api/authApi", () => ({
    forgotPassword: vi.fn(),
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

import { forgotPassword } from "../../features/auth/api/authApi";

describe("ForgotPasswordPage", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders forgot password form correctly", () => {
        renderWithProviders(<ForgotPasswordPage />);

        expect(screen.getByText("Forgot Password?")).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /send reset code/i })).toBeInTheDocument();
    });

    it("renders back to login link", () => {
        renderWithProviders(<ForgotPasswordPage />);
        expect(screen.getByText(/back to login/i)).toBeInTheDocument();
    });

    it("updates email field when typed into", () => {
        renderWithProviders(<ForgotPasswordPage />);
        const emailInput = screen.getByLabelText(/email address/i);
        fireEvent.change(emailInput, { target: { value: "parent@test.com" } });
        expect(emailInput).toHaveValue("parent@test.com");
    });

    it("shows success message after sending reset code", async () => {
        const mockForgotPassword = vi.mocked(forgotPassword);
        mockForgotPassword.mockResolvedValueOnce({
            message: "If the email exists, a reset code has been sent.",
        });

        renderWithProviders(<ForgotPasswordPage />);

        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "parent@test.com" } });
        fireEvent.click(screen.getByRole("button", { name: /send reset code/i }));

        await waitFor(() => {
            expect(screen.getByText(/reset code has been sent/i)).toBeInTheDocument();
        });
    });

    it("shows enter reset code button after successful request", async () => {
        const mockForgotPassword = vi.mocked(forgotPassword);
        mockForgotPassword.mockResolvedValueOnce({
            message: "If the email exists, a reset code has been sent.",
        });

        renderWithProviders(<ForgotPasswordPage />);

        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "parent@test.com" } });
        fireEvent.click(screen.getByRole("button", { name: /send reset code/i }));

        await waitFor(() => {
            expect(screen.getByText(/enter reset code/i)).toBeInTheDocument();
        });
    });

    it("shows error message when API call fails", async () => {
        const mockForgotPassword = vi.mocked(forgotPassword);
        mockForgotPassword.mockRejectedValueOnce({
            response: { data: { message: "Something went wrong." } },
        });

        renderWithProviders(<ForgotPasswordPage />);

        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "bad@email" } });
        fireEvent.click(screen.getByRole("button", { name: /send reset code/i }));

        await waitFor(() => {
            expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
        });
    });

});