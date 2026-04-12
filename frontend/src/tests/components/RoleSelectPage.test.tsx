import { screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { renderWithProviders } from "../helpers/renderWithProviders";
import RoleSelectPage from "../../features/auth/pages/RoleSelectPage";

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
    };
});

describe("RoleSelectPage", () => {

    it("renders the role selection page correctly", () => {
        renderWithProviders(<RoleSelectPage />);
        expect(screen.getByText(/who's logging in/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /i'm a parent/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /i'm a child/i })).toBeInTheDocument();
    });

    it("shows sign up option", () => {
        renderWithProviders(<RoleSelectPage />);
        expect(screen.getByText(/sign up/i)).toBeInTheDocument();
    });

    it("navigates to parent login when parent button is clicked", () => {
        renderWithProviders(<RoleSelectPage />);
        fireEvent.click(screen.getByRole("button", { name: /i'm a parent/i }));
        expect(mockNavigate).toHaveBeenCalledWith("/auth/login");
    });

    it("navigates to child pin page when child button is clicked", () => {
        renderWithProviders(<RoleSelectPage />);
        fireEvent.click(screen.getByRole("button", { name: /i'm a child/i }));
        expect(mockNavigate).toHaveBeenCalledWith("/auth/child/pin");
    });

    it("navigates to signup when sign up is clicked", () => {
        renderWithProviders(<RoleSelectPage />);
        fireEvent.click(screen.getByText(/sign up/i));
        expect(mockNavigate).toHaveBeenCalledWith("/auth/signup");
    });

});