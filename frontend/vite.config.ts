import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        headers: {
            "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
        },
    },
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./src/tests/setup.tsx"],
        css: false,
        include: ["src/tests/**/*.test.tsx"],
        exclude: ["e2e/**", "node_modules/**"],
        server: {
            deps: {
                // Force MUI icons to use the single-file CJS build
                // This prevents Windows EMFILE (too many open files) error
                inline: ["@mui/icons-material", "@mui/material", "@emotion/react", "@emotion/styled"],
            },
        },
    },
});