import { screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders } from "../helpers/renderWithProviders";
import AdminLoginPage from "../../features/auth/pages/AdminLoginPage";

vi.mock("../../features/auth/api/authApi", () => ({
    adminLogin: vi.fn(),
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
        useLocation: () => ({ state: null, pathname: "/auth/admin" }),
    };
});

import { adminLogin } from "../../features/auth/api/authApi";

describe("AdminLoginPage", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders admin login form correctly", () => {
        renderWithProviders(<AdminLoginPage />);

        expect(screen.getByText("Admin Login")).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    });

    it("does NOT show a Google login button", () => {
        renderWithProviders(<AdminLoginPage />);
        expect(screen.queryByText(/google/i)).not.toBeInTheDocument();
    });

    it("does NOT show a create account link", () => {
        renderWithProviders(<AdminLoginPage />);
        expect(screen.queryByText(/create account/i)).not.toBeInTheDocument();
    });

    it("calls adminLogin with correct credentials", async () => {
        const mockAdminLogin = vi.mocked(adminLogin);
        mockAdminLogin.mockResolvedValueOnce({
            message: "Admin login successful",
            user: { _id: "1", name: "Admin", email: "admin@test.com", role: "admin", emailVerified: true },
            accessToken: "admin-token",
        });

        renderWithProviders(<AdminLoginPage />);

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "admin@test.com" } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "Admin123!" } });
        fireEvent.click(screen.getByRole("button", { name: /log in/i }));

        await waitFor(() => {
            expect(mockAdminLogin).toHaveBeenCalledWith({
                email: "admin@test.com",
                password: "Admin123!",
            });
        });
    });

    it("navigates to admin dashboard on successful login", async () => {
        const mockAdminLogin = vi.mocked(adminLogin);
        mockAdminLogin.mockResolvedValueOnce({
            message: "Admin login successful",
            user: { _id: "1", name: "Admin", email: "admin@test.com", role: "admin", emailVerified: true },
            accessToken: "admin-token",
        });

        renderWithProviders(<AdminLoginPage />);

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "admin@test.com" } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "Admin123!" } });
        fireEvent.click(screen.getByRole("button", { name: /log in/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/admin/dashboard", { replace: true });
        });
    });

    it("shows error message on failed login", async () => {
        const mockAdminLogin = vi.mocked(adminLogin);
        mockAdminLogin.mockRejectedValueOnce({
            response: { data: { message: "Invalid email or password" } },
        });

        renderWithProviders(<AdminLoginPage />);

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "admin@test.com" } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrongpass" } });
        fireEvent.click(screen.getByRole("button", { name: /log in/i }));

        await waitFor(() => {
            expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
        });
    });

});