import "@testing-library/jest-dom";
import { vi } from "vitest";
import React from "react";

// Mock framer-motion so animations don't break tests
vi.mock("framer-motion", () => ({
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
            React.createElement("div", props, children)
        ),
        form: ({ children, ...props }: React.HTMLAttributes<HTMLFormElement>) => (
            React.createElement("form", props, children)
        ),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock image imports
vi.mock("../assets/kip_b.png", () => ({ default: "kip_b.png" }));
vi.mock("../assets/kip.png", () => ({ default: "kip.png" }));

// Mock @react-oauth/google
vi.mock("@react-oauth/google", () => ({
    GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => children,
    useGoogleLogin: () => vi.fn(),
}));