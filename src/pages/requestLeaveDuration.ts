export type HalfDayType = "start" | "end" | "single";
export type LeaveDurationOption = HalfDayType | "full";

export function normalizeLeaveDuration(
  duration: LeaveDurationOption,
  startDate: string,
  endDate: string,
): LeaveDurationOption {
  if (duration === "single" && startDate && endDate && startDate !== endDate) {
    return "full";
  }

  return duration;
}

export function toHalfDayType(duration: LeaveDurationOption): HalfDayType | undefined {
  return duration === "full" ? undefined : duration;
}
