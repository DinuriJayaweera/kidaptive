import { test, expect } from "@playwright/test";

test.describe("Verify Email Page", () => {

    test("redirects to signup if no email in state", async ({ page }) => {
        // Navigate directly without state — should redirect
        await page.goto("/auth/verify-email");
        await expect(page).toHaveURL(/signup/, { timeout: 5000 });
    });

});