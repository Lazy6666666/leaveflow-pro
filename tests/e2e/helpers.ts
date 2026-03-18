import { Page } from '@playwright/test';

/** Returns true if the auth guard redirected the page. Callers should skip the test. */
export function isAuthRedirect(page: Page): boolean {
  return page.url().includes('/auth');
}
