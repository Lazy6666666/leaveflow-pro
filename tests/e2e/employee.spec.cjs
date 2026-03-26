const { test, expect } = require("@playwright/test");
const { isAuthRedirect } = require("./helpers.cjs");

test.describe("Leave Hub", () => {
  const tabs = [
    { value: "summary", label: "Summary" },
    { value: "request", label: "Request" },
    { value: "history", label: "History" },
    { value: "calendar", label: "Calendar" },
  ];

  for (const { value, label } of tabs) {
    test(`tab=${value} renders trigger`, async ({ page }) => {
      await page.goto(`/leave-hub?tab=${value}`);
      if (isAuthRedirect(page)) return;
      await expect(page.getByRole("tab", { name: label })).toBeVisible();
    });
  }

  test("tab switching updates URL", async ({ page }) => {
    await page.goto("/leave-hub?tab=summary");
    if (isAuthRedirect(page)) return;
    await page.getByRole("tab", { name: "Request" }).click();
    await expect(page).toHaveURL(/tab=request/);
  });
});

test.describe("Identity Hub", () => {
  const tabs = [
    { value: "profile", label: "Profile" },
    { value: "biometrics", label: "Biometrics" },
  ];

  for (const { value, label } of tabs) {
    test(`tab=${value} renders trigger`, async ({ page }) => {
      await page.goto(`/identity-hub?tab=${value}`);
      if (isAuthRedirect(page)) return;
      await expect(page.getByRole("tab", { name: label })).toBeVisible();
    });
  }
});
