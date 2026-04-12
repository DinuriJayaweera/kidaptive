import { test, expect } from "@playwright/test";

test.describe("Parent Signup Page", () => {

    test.beforeEach(async ({ page }) => {
        await page.goto("/auth/signup");
    });

    test("page loads and shows signup form", async ({ page }) => {
        await expect(page.getByText("Create Parent Account")).toBeVisible();
        await expect(page.getByLabel("Full Name")).toBeVisible();
        await expect(page.getByLabel("Email Address")).toBeVisible();
        await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
    });

    test("shows Google signup button", async ({ page }) => {
        await expect(page.getByText(/sign up with google/i)).toBeVisible();
    });

    test("shows terms checkbox", async ({ page }) => {
        await expect(page.getByText(/terms of service/i)).toBeVisible();
    });

    test("shows guardian confirmation checkbox", async ({ page }) => {
        await expect(page.getByText(/parent or legal guardian/i)).toBeVisible();
    });

    test("clicking log in link navigates to login page", async ({ page }) => {
        await page.getByText(/log in/i).click();
        await expect(page).toHaveURL(/login/);
    });

    test("can fill in all form fields", async ({ page }) => {
        await page.getByLabel("Full Name").fill("Jane Doe");
        await page.getByLabel("Email Address").fill("jane@test.com");
        await page.getByLabel("Password", { exact: true }).fill("Password123!");
        await page.getByLabel("Confirm Password").fill("Password123!");

        await expect(page.getByLabel("Full Name")).toHaveValue("Jane Doe");
        await expect(page.getByLabel("Email Address")).toHaveValue("jane@test.com");
    });

    test("shows error when terms not accepted", async ({ page }) => {
        await page.getByLabel("Full Name").fill("Jane Doe");
        await page.getByLabel("Email Address").fill("jane@test.com");
        await page.getByLabel("Password", { exact: true }).fill("Password123!");
        await page.getByLabel("Confirm Password").fill("Password123!");

        await page.getByRole("button", { name: /create account/i }).click();

        await expect(page.getByText(/please accept the terms/i)).toBeVisible({ timeout: 3000 });
    });

});