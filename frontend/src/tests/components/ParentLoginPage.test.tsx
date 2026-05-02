import { screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders } from "../helpers/renderWithProviders";
import ParentLoginPage from "../../features/auth/pages/ParentLoginPage";

// Mock the API call
vi.mock("../../features/auth/api/authApi", () => ({
    parentLogin: vi.fn(),
    googleLogin: vi.fn(),
}));

// Mock useAuth so we can track login calls
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

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ state: null, pathname: "/auth/login" }),
    };
});

import { parentLogin } from "../../features/auth/api/authApi";

describe("ParentLoginPage", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Rendering ──────────────────────────────────────────────────────────────

    it("renders the login form correctly", () => {
        renderWithProviders(<ParentLoginPage />);

        expect(screen.getByText("Welcome Back!")).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    });

    it("renders the Google login button", () => {
        renderWithProviders(<ParentLoginPage />);
        expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
    });

    it("renders the forgot password link", () => {
        renderWithProviders(<ParentLoginPage />);
        expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    });

    it("renders the create account link", () => {
        renderWithProviders(<ParentLoginPage />);
        expect(screen.getByText(/create account/i)).toBeInTheDocument();
    });

    // ── Form Interaction ───────────────────────────────────────────────────────

    it("updates email field when typed into", () => {
        renderWithProviders(<ParentLoginPage />);
        const emailInput = screen.getByLabelText(/email/i);
        fireEvent.change(emailInput, { target: { value: "parent@test.com" } });
        expect(emailInput).toHaveValue("parent@test.com");
    });

    it("updates password field when typed into", () => {
        renderWithProviders(<ParentLoginPage />);
        const passwordInput = screen.getByLabelText(/password/i);
        fireEvent.change(passwordInput, { target: { value: "Password123!" } });
        expect(passwordInput).toHaveValue("Password123!");
    });

    it("toggles password visibility when eye icon is clicked", () => {
    renderWithProviders(<ParentLoginPage />);
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    // Target specifically the visibility icon button using its test id
    const toggleBtn = screen.getByTestId("VisibilityIcon").closest("button")!;
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute("type", "text");

    // Click again to hide
    const toggleBtn2 = screen.getByTestId("VisibilityOffIcon").closest("button")!;
    fireEvent.click(toggleBtn2);
    expect(passwordInput).toHaveAttribute("type", "password");
});

    // ── Successful Login ───────────────────────────────────────────────────────

    it("calls parentLogin with correct credentials on submit", async () => {
        const mockParentLogin = vi.mocked(parentLogin);
        mockParentLogin.mockResolvedValueOnce({
            message: "Login successful",
            user: { _id: "1", name: "Test Parent", email: "parent@test.com", role: "parent", emailVerified: true },
            accessToken: "fake-token",
        });

        renderWithProviders(<ParentLoginPage />);

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "parent@test.com" } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "Password123!" } });
        fireEvent.click(screen.getByRole("button", { name: /log in/i }));

        await waitFor(() => {
            expect(mockParentLogin).toHaveBeenCalledWith({
                email: "parent@test.com",
                password: "Password123!",
            });
        });
    });

    it("calls auth login and navigates to dashboard on success", async () => {
        const mockParentLogin = vi.mocked(parentLogin);
        mockParentLogin.mockResolvedValueOnce({
            message: "Login successful",
            user: { _id: "1", name: "Test Parent", email: "parent@test.com", role: "parent", emailVerified: true },
            accessToken: "fake-token",
        });

        renderWithProviders(<ParentLoginPage />);

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "parent@test.com" } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "Password123!" } });
        fireEvent.click(screen.getByRole("button", { name: /log in/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith("/parent/dashboard", { replace: true });
        });
    });

    // ── Error Handling ─────────────────────────────────────────────────────────

    it("shows error message when login fails", async () => {
        const mockParentLogin = vi.mocked(parentLogin);
        mockParentLogin.mockRejectedValueOnce({
            response: { data: { message: "Invalid email or password" } },
        });

        renderWithProviders(<ParentLoginPage />);

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "parent@test.com" } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrongpassword" } });
        fireEvent.click(screen.getByRole("button", { name: /log in/i }));

        await waitFor(() => {
            expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
        });
    });

    it("clears error message when user starts typing again", async () => {
        const mockParentLogin = vi.mocked(parentLogin);
        mockParentLogin.mockRejectedValueOnce({
            response: { data: { message: "Invalid email or password" } },
        });

        renderWithProviders(<ParentLoginPage />);

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "parent@test.com" } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong" } });
        fireEvent.click(screen.getByRole("button", { name: /log in/i }));

        await waitFor(() => {
            expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
        });

        // Start typing again — error should disappear
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "new@test.com" } });
        expect(screen.queryByText("Invalid email or password")).not.toBeInTheDocument();
    });

    it("shows fallback error message when API returns no message", async () => {
        const mockParentLogin = vi.mocked(parentLogin);
        mockParentLogin.mockRejectedValueOnce(new Error("Network error"));

        renderWithProviders(<ParentLoginPage />);

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "parent@test.com" } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "Password123!" } });
        fireEvent.click(screen.getByRole("button", { name: /log in/i }));

        await waitFor(() => {
            expect(screen.getByText("Login failed.")).toBeInTheDocument();
        });
    });

});