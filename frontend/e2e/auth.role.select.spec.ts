import { test, expect } from "@playwright/test";

test.describe("Role Select Page", () => {

    test.beforeEach(async ({ page }) => {
        await page.goto("/auth/role");
    });

    test("page loads with role selection", async ({ page }) => {
        await expect(page.getByText(/who's logging in/i)).toBeVisible();
        await expect(page.getByRole("button", { name: /i'm a parent/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /i'm a child/i })).toBeVisible();
    });

    test("clicking parent button navigates to parent login", async ({ page }) => {
        await page.getByRole("button", { name: /i'm a parent/i }).click();
        await expect(page).toHaveURL(/auth\/login/);
    });

    test("clicking child button navigates to child pin page", async ({ page }) => {
        await page.getByRole("button", { name: /i'm a child/i }).click();
        await expect(page).toHaveURL(/child\/pin/);
    });

    test("shows sign up link", async ({ page }) => {
        await expect(page.getByText(/sign up/i)).toBeVisible();
    });

});