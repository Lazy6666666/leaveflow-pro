import { test, expect } from '@playwright/test';
import { isAuthRedirect } from './helpers';

const SYSTEM_TABS = [
  { value: 'policies',          label: 'Policies' },
  { value: 'sites',             label: 'Sites' },
  { value: 'attendance-config', label: 'Attendance Config' },
  { value: 'biometrics',        label: 'Biometrics' },
  { value: 'shifts',            label: 'Shifts' },
  { value: 'rosters',           label: 'Rosters' },
];

const HR_TABS = [
  { value: 'directory',    label: 'Directory' },
  { value: 'departments',  label: 'Departments' },
  { value: 'balances',     label: 'Balances' },
  { value: 'attendance',   label: 'Attendance' },
  { value: 'analytics',    label: 'Analytics' },
  { value: 'audits',       label: 'Audits' },
  { value: 'trust-review', label: 'Trust Review' },
];

test.describe('System Hub', () => {
  for (const { value, label } of SYSTEM_TABS) {
    test(`tab=${value} renders trigger`, async ({ page }) => {
      await page.goto(`/admin/system?tab=${value}`);
      if (isAuthRedirect(page)) return;
      await expect(page.getByRole('tab', { name: label })).toBeVisible();
    });
  }
});

test.describe('HR Operations Hub', () => {
  for (const { value, label } of HR_TABS) {
    test(`tab=${value} renders trigger`, async ({ page }) => {
      await page.goto(`/admin/hr-operations?tab=${value}`);
      if (isAuthRedirect(page)) return;
      await expect(page.getByRole('tab', { name: label })).toBeVisible();
    });
  }
});
