import { formatDateLabel } from "./formatters";

export function formatApprovalDateRange(startDate: string, endDate: string) {
  if (startDate === endDate) {
    return formatDateLabel(startDate);
  }

  return `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`;
}

export function getDecisionVerb(status: "approved" | "rejected") {
  return status === "approved" ? "Approve" : "Reject";
}
