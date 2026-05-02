import { test, expect } from "@playwright/test";

test.describe("Reset Password Page", () => {

    test.beforeEach(async ({ page }) => {
        await page.goto("/auth/reset-password");
    });

    test("page loads with reset password form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /reset password/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /reset password/i })).toBeVisible();
});

    test("shows back to login link", async ({ page }) => {
        await expect(page.getByText(/back to login/i)).toBeVisible();
    });

    test("clicking back to login navigates to login page", async ({ page }) => {
        await page.getByText(/back to login/i).click();
        await expect(page).toHaveURL(/login/);
    });

    test("can fill in all fields", async ({ page }) => {
        await page.getByLabel("Email").fill("parent@test.com");
        await page.getByLabel(/6-digit reset code/i).fill("123456");
        await page.getByLabel("New Password").fill("NewPass123!");
        await page.getByLabel("Confirm Password").fill("NewPass123!");

        await expect(page.getByLabel("Email")).toHaveValue("parent@test.com");
    });

    test("shows error on wrong OTP", async ({ page }) => {
        await page.getByLabel("Email").fill("parent@test.com");
        await page.getByLabel(/6-digit reset code/i).fill("999999");
        await page.getByLabel("New Password").fill("NewPass123!");
        await page.getByLabel("Confirm Password").fill("NewPass123!");
        await page.getByRole("button", { name: /reset password/i }).click();

        await expect(page.getByRole("alert")).toBeVisible({ timeout: 5000 });
    });

});