import { test, expect } from "@playwright/test";

test.describe("Child Pin Page", () => {

    test.beforeEach(async ({ page }) => {
        await page.goto("/auth/child/pin");
    });

    test("page loads with emoji keypad", async ({ page }) => {
        await expect(page.getByText(/tap your secret emoji pattern/i)).toBeVisible();
        await expect(page.getByRole("button", { name: /let's go/i })).toBeVisible();
    });

    test("shows username input when no child pre-selected", async ({ page }) => {
        await expect(page.getByPlaceholder(/your username/i)).toBeVisible();
    });

    test("shows back to roles link", async ({ page }) => {
        await expect(page.getByText(/back to roles/i)).toBeVisible();
    });

    test("clicking back to roles navigates to role select", async ({ page }) => {
        await page.getByText(/back to roles/i).click();
        await expect(page).toHaveURL(/auth\/role/);
    });

    test("Let's go button is disabled when no emoji selected", async ({ page }) => {
    // Button should be disabled until 4 emojis are picked
    await expect(page.getByRole("button", { name: /let's go/i })).toBeDisabled();
});

});