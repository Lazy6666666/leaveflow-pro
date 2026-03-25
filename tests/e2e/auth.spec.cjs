const { test, expect } = require("@playwright/test");

const PROTECTED = [
  "/dashboard",
  "/leave-hub",
  "/identity-hub",
  "/attendance",
  "/ai-workspace",
];

test.describe("Auth guard", () => {
  for (const route of PROTECTED) {
    test(`${route} redirects to /auth when unauthenticated`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/auth/);
    });
  }
});

test.describe("Legacy redirects", () => {
  const redirects = [
    ["/my-leave", "/leave-hub?tab=summary"],
    ["/request-leave", "/leave-hub?tab=request"],
    ["/leave-history", "/leave-hub?tab=history"],
    ["/holidays", "/leave-hub?tab=calendar"],
    ["/profile", "/identity-hub?tab=profile"],
    ["/face-enrollment", "/identity-hub?tab=biometrics"],
    ["/manager/approvals", "/manager/hub?tab=approvals"],
    ["/admin/policies", "/admin/system?tab=policies"],
    ["/admin/employees", "/admin/hr-operations?tab=directory"],
    ["/admin/trust-review", "/admin/hr-operations?tab=trust-review"],
  ];

  for (const [from, to] of redirects) {
    test(`${from} -> ${to}`, async ({ page }) => {
      await page.goto(from);
      const url = page.url();
      const isAuthPage = url.includes("/auth");
      const isTarget = url.includes(to.split("?")[0]);
      expect(isAuthPage || isTarget).toBe(true);
    });
  }
});
