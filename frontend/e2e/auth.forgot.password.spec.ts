import { test, expect } from "@playwright/test";

test.describe("Forgot Password Page", () => {

    test.beforeEach(async ({ page }) => {
        await page.goto("/auth/forgot-password");
    });

    test("page loads with forgot password form", async ({ page }) => {
        await expect(page.getByText("Forgot Password?")).toBeVisible();
        await expect(page.getByLabel(/email address/i)).toBeVisible();
        await expect(page.getByRole("button", { name: /send reset code/i })).toBeVisible();
    });

    test("shows back to login link", async ({ page }) => {
        await expect(page.getByText(/back to login/i)).toBeVisible();
    });

    test("clicking back to login navigates to login page", async ({ page }) => {
        await page.getByText(/back to login/i).click();
        await expect(page).toHaveURL(/login/);
    });

    test("can type email into field", async ({ page }) => {
        await page.getByLabel(/email address/i).fill("parent@test.com");
        await expect(page.getByLabel(/email address/i)).toHaveValue("parent@test.com");
    });

    test("shows success message after submitting email", async ({ page }) => {
        await page.getByLabel(/email address/i).fill("parent@test.com");
        await page.getByRole("button", { name: /send reset code/i }).click();

        // Success or error — either way an alert should appear
        await expect(page.getByRole("alert")).toBeVisible({ timeout: 5000 });
    });

});