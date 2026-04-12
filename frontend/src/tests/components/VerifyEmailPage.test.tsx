import { screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders } from "../helpers/renderWithProviders";
import VerifyEmailPage from "../../features/auth/pages/VerifyEmailPage";

vi.mock("../../features/auth/api/authApi", () => ({
    verifyEmailOtp: vi.fn(),
    resendOtp: vi.fn(),
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
        // Provide email via location state
        useLocation: () => ({ state: { email: "parent@test.com" }, pathname: "/auth/verify-email" }),
    };
});

import { verifyEmailOtp, resendOtp } from "../../features/auth/api/authApi";

describe("VerifyEmailPage", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Rendering ──────────────────────────────────────────────────────────────

    it("renders the verify email form correctly", () => {
        renderWithProviders(<VerifyEmailPage />);
        expect(screen.getByText("Check your email")).toBeInTheDocument();
        expect(screen.getByText(/parent@test.com/)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /verify email/i })).toBeInTheDocument();
    });

    it("renders 6 OTP input boxes", () => {
        renderWithProviders(<VerifyEmailPage />);
        const inputs = screen.getAllByRole("textbox");
        // 6 OTP boxes
        expect(inputs.length).toBeGreaterThanOrEqual(6);
    });

    it("renders resend code button", () => {
        renderWithProviders(<VerifyEmailPage />);
        expect(screen.getByText(/resend code/i)).toBeInTheDocument();
    });

    it("renders back to signup link", () => {
        renderWithProviders(<VerifyEmailPage />);
        expect(screen.getByText(/back to signup/i)).toBeInTheDocument();
    });

    // ── OTP Input ──────────────────────────────────────────────────────────────

    it("shows error when submitting without filling all 6 digits", async () => {
        renderWithProviders(<VerifyEmailPage />);
        fireEvent.click(screen.getByRole("button", { name: /verify email/i }));

        await waitFor(() => {
            expect(screen.getByText(/please enter all 6 digits/i)).toBeInTheDocument();
        });
    });

    // ── Successful Verification ────────────────────────────────────────────────

    it("calls verifyEmailOtp and navigates to dashboard on success", async () => {
        const mockVerify = vi.mocked(verifyEmailOtp);
        mockVerify.mockResolvedValueOnce({
            success: true,
            message: "Email verified!",
            user: { _id: "1", name: "Jane", email: "parent@test.com", role: "parent", emailVerified: true },
            accessToken: "fake-token",
        });

        renderWithProviders(<VerifyEmailPage />);

        // Fill in all 6 OTP boxes
        const inputs = screen.getAllByRole("textbox");
        ["1", "2", "3", "4", "5", "6"].forEach((digit, i) => {
            fireEvent.change(inputs[i], { target: { value: digit } });
        });

        fireEvent.click(screen.getByRole("button", { name: /verify email/i }));

        await waitFor(() => {
            expect(mockVerify).toHaveBeenCalledWith({ email: "parent@test.com", otp: "123456" });
            expect(mockLogin).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith("/parent/dashboard", { replace: true });
        });
    });

    // ── Wrong OTP ─────────────────────────────────────────────────────────────

    it("shows error message when OTP is wrong", async () => {
        const mockVerify = vi.mocked(verifyEmailOtp);
        mockVerify.mockResolvedValueOnce({
            success: false,
            message: "Invalid verification code",
            remainingAttempts: 4,
        });

        renderWithProviders(<VerifyEmailPage />);

        const inputs = screen.getAllByRole("textbox");
        ["9", "9", "9", "9", "9", "9"].forEach((digit, i) => {
            fireEvent.change(inputs[i], { target: { value: digit } });
        });

        fireEvent.click(screen.getByRole("button", { name: /verify email/i }));

        await waitFor(() => {
            expect(screen.getByText("Invalid verification code")).toBeInTheDocument();
        });
    });

    it("shows remaining attempts when OTP is wrong", async () => {
        const mockVerify = vi.mocked(verifyEmailOtp);
        mockVerify.mockResolvedValueOnce({
            success: false,
            message: "Invalid verification code",
            remainingAttempts: 3,
        });

        renderWithProviders(<VerifyEmailPage />);

        const inputs = screen.getAllByRole("textbox");
        ["9", "9", "9", "9", "9", "9"].forEach((digit, i) => {
            fireEvent.change(inputs[i], { target: { value: digit } });
        });

        fireEvent.click(screen.getByRole("button", { name: /verify email/i }));

        await waitFor(() => {
            expect(screen.getByText(/3 attempt/i)).toBeInTheDocument();
        });
    });

    // ── Resend OTP ─────────────────────────────────────────────────────────────

    it("shows success message when resend code is clicked", async () => {
        const mockResend = vi.mocked(resendOtp);
        mockResend.mockResolvedValueOnce({ message: "A new code has been sent!" });

        renderWithProviders(<VerifyEmailPage />);
        fireEvent.click(screen.getByText(/resend code/i));

        await waitFor(() => {
            expect(screen.getByText(/new code has been sent/i)).toBeInTheDocument();
        });
    });

    it("shows error when resend fails (cooldown)", async () => {
        const mockResend = vi.mocked(resendOtp);
        mockResend.mockRejectedValueOnce({
            response: { data: { message: "Please wait 45 seconds before requesting a new code." } },
        });

        renderWithProviders(<VerifyEmailPage />);
        fireEvent.click(screen.getByText(/resend code/i));

        await waitFor(() => {
            expect(screen.getByText(/please wait/i)).toBeInTheDocument();
        });
    });

});