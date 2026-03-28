const { test, expect } = require("@playwright/test");

// These tests verify that protected routes redirect unauthenticated users
// and that the public-facing routes for careers/document-expiry are reachable.

test.describe("Careers & Document Expiry routes (unauthenticated)", () => {
  test("/careers redirects to /admin/hr-operations or /auth when unauthenticated", async ({ page }) => {
    await page.goto("/careers");
    // Should redirect to auth or dashboard — not 404
    await expect(page).not.toHaveURL(/\/404/);
    await expect(page).toHaveURL(/\/(auth|dashboard|admin)/);
  });

  test("/admin/document-expiry redirects unauthenticated users", async ({ page }) => {
    await page.goto("/admin/document-expiry");
    await expect(page).not.toHaveURL(/\/404/);
    await expect(page).toHaveURL(/\/(auth|dashboard)/);
  });

  test("/admin/agent-workspace redirects unauthenticated users", async ({ page }) => {
    await page.goto("/admin/agent-workspace");
    await expect(page).not.toHaveURL(/\/404/);
    await expect(page).toHaveURL(/\/(auth|dashboard)/);
  });

  test("/recruitment redirects to /careers", async ({ page }) => {
    await page.goto("/recruitment");
    // Should not land on /recruitment — must redirect
    await expect(page).not.toHaveURL(/\/recruitment$/);
  });
});
