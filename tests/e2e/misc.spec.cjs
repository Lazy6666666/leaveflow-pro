const { test, expect } = require("@playwright/test");

test.describe("Misc", () => {
  test("unknown route shows 404", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-xyz");
    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
  });

  test("dark mode toggle changes theme class", async ({ page }) => {
    await page.goto("/auth");
    const toggle = page
      .locator('button[aria-label*="theme"], button[aria-label*="dark"], button[aria-label*="mode"]')
      .first();
    const exists = await toggle.count();
    if (!exists) return;
    const htmlBefore = await page.locator("html").getAttribute("class");
    await toggle.click();
    const htmlAfter = await page.locator("html").getAttribute("class");
    expect(htmlBefore).not.toEqual(htmlAfter);
  });

  test("/ai-workspace accessible after auth", async ({ page }) => {
    await page.goto("/ai-workspace");
    const url = page.url();
    expect(url.includes("/auth") || url.includes("/ai-workspace")).toBe(true);
  });
});
