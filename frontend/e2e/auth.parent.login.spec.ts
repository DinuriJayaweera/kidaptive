import { test, expect } from "@playwright/test";

test.describe("Parent Login Page", () => {

    test.beforeEach(async ({ page }) => {
        await page.goto("/auth/login");
    });

    // ── Page loads ─────────────────────────────────────────────────────────────

    test("page loads and shows login form", async ({ page }) => {
        await expect(page.getByText("Welcome Back!")).toBeVisible();
        await expect(page.getByLabel("Email")).toBeVisible();
        await expect(page.getByLabel("Password")).toBeVisible();
        await expect(page.getByRole("button", { name: /log in/i })).toBeVisible();
    });

    test("shows Google login button", async ({ page }) => {
        await expect(page.getByText(/continue with google/i)).toBeVisible();
    });

    test("shows forgot password link", async ({ page }) => {
        await expect(page.getByText(/forgot password/i)).toBeVisible();
    });

    test("shows create account link", async ({ page }) => {
        await expect(page.getByText(/create account/i)).toBeVisible();
    });

    // ── Navigation ─────────────────────────────────────────────────────────────

    test("clicking forgot password navigates to forgot password page", async ({ page }) => {
        await page.getByText(/forgot password/i).click();
        await expect(page).toHaveURL(/forgot-password/);
    });

    test("clicking create account navigates to signup page", async ({ page }) => {
        await page.getByText(/create account/i).click();
        await expect(page).toHaveURL(/signup/);
    });

    // ── Form interaction ───────────────────────────────────────────────────────

    test("can type into email and password fields", async ({ page }) => {
        await page.getByLabel("Email").fill("parent@test.com");
        await page.getByLabel("Password").fill("Password123!");

        await expect(page.getByLabel("Email")).toHaveValue("parent@test.com");
        await expect(page.getByLabel("Password")).toHaveValue("Password123!");
    });

    test("password field is hidden by default", async ({ page }) => {
        const passwordInput = page.getByLabel("Password");
        await expect(passwordInput).toHaveAttribute("type", "password");
    });

    test("clicking eye icon shows password", async ({ page }) => {
    await page.getByLabel("Password").fill("Password123!");
    // Click the visibility icon button specifically using its test id
    await page.getByTestId("VisibilityIcon").click();
    await expect(page.getByLabel("Password")).toHaveAttribute("type", "text");
});

    // ── Error handling ─────────────────────────────────────────────────────────

    test("shows error message on failed login", async ({ page }) => {
        await page.getByLabel("Email").fill("wrong@test.com");
        await page.getByLabel("Password").fill("wrongpassword");
        await page.getByRole("button", { name: /log in/i }).click();

        // Wait for error to appear
        await expect(page.getByRole("alert")).toBeVisible({ timeout: 5000 });
    });

});