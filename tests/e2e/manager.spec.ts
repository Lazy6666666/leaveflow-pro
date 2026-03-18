import { test, expect } from '@playwright/test';
import { isAuthRedirect } from './helpers';

const MANAGER_TABS = [
  { value: 'approvals',       label: 'Approvals' },
  { value: 'team-calendar',   label: 'Team Calendar' },
  { value: 'team-attendance', label: 'Team Attendance' },
  { value: 'delegation',      label: 'Delegation' },
];

test.describe('Manager Hub', () => {
  for (const { value, label } of MANAGER_TABS) {
    test(`tab=${value} renders trigger`, async ({ page }) => {
      await page.goto(`/manager/hub?tab=${value}`);
      if (isAuthRedirect(page)) return;
      await expect(page.getByRole('tab', { name: label })).toBeVisible();
    });
  }
});
