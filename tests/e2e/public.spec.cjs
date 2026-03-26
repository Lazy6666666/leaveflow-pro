const { test, expect } = require("@playwright/test");

test.describe("Public routes", () => {
  test("landing page renders the premium navbar and trial CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.getByText("Balance.").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Start Trial" }).first()).toBeVisible();
  });

  test("landing page exposes the current hero heading and actions", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Global Operations\. Deterministically\./i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Deploy Infrastructure" })).toBeVisible();
    await expect(page.getByRole("button", { name: "View Documentation" })).toBeVisible();
  });

  test("/auth renders sign-in form", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email address" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
  });

  test("/reset-password resolves into the auth recovery flow", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page).toHaveURL(/\/auth(?:\/.*)?$/);
    await expect(page.getByRole("textbox", { name: "Email address" })).toBeVisible();
  });
});
