import { test, expect } from '@playwright/test';

test.describe('Public routes', () => {
  test('landing page renders BALANCE navbar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('BALANCE').first()).toBeVisible();
  });

  test('landing page has scroll hint', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Scroll to explore')).toBeVisible();
  });

  test('/auth renders sign-in form', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  });

  test('/reset-password renders', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page).toHaveURL(/reset-password/);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
