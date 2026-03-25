export const EXPENSE_STATUS_VARIANT = {
  approved: "default",
  pending: "secondary",
  rejected: "destructive",
} as const;

export const DEFAULT_EXPENSE_CATEGORIES = [
  { label: "Travel", value: "travel" },
  { label: "Meals", value: "meals" },
  { label: "Lodging", value: "lodging" },
  { label: "Office supplies", value: "supplies" },
  { label: "Client meeting", value: "client" },
  { label: "Mileage", value: "mileage" },
  { label: "Other", value: "other" },
] as const;

export type ExpenseCategoryOption = (typeof DEFAULT_EXPENSE_CATEGORIES)[number];
export type ExpenseCategory = ExpenseCategoryOption["value"];
