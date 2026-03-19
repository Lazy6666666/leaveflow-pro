import { AlertTriangle, Lock, Plus } from "lucide-react";
import type { FunctionReturnType } from "convex/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PayrollExportButton } from "@/components/payroll/PayrollExportButton";
import { api } from "@/lib/convexApi";

type PayrollPeriod = FunctionReturnType<typeof api.payroll.getPayrollPeriods>[number];
type PayrollExportRecord = FunctionReturnType<typeof api.payroll.getPayrollExportHistory>[number];

type PayrollPeriodsTabProps = {
  creatingPeriod: boolean;
  exportHistory: PayrollExportRecord[];
  lockingPeriodId: PayrollPeriod["_id"] | null;
  payrollPeriods: PayrollPeriod[];
  siteId?: string;
  onCreatePeriod: () => void;
  onLockPeriod: (periodId: PayrollPeriod["_id"]) => void;
  onViewExceptions: (period: PayrollPeriod) => void;
};

export function PayrollPeriodsTab({
  creatingPeriod,
  exportHistory,
  lockingPeriodId,
  payrollPeriods,
  siteId,
  onCreatePeriod,
  onLockPeriod,
  onViewExceptions,
}: PayrollPeriodsTabProps) {
  const exportHistoryByPeriodId = new Map<string, PayrollExportRecord[]>();
  for (const record of exportHistory) {
    if (!record.periodId) {
      continue;
    }
    const bucket = exportHistoryByPeriodId.get(record.periodId) ?? [];
    bucket.push(record);
    exportHistoryByPeriodId.set(record.periodId, bucket);
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Payroll Periods</h2>
        <Button size="sm" disabled={creatingPeriod} onClick={onCreatePeriod}>
          <Plus className="mr-2 h-4 w-4" />
          {creatingPeriod ? "Creating..." : "New Period"}
        </Button>
      </div>

      {payrollPeriods.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">No payroll periods yet. Create one to get started.</CardContent>
        </Card>
      ) : (
        payrollPeriods.map((period) => (
          <Card key={period._id}>
            <CardHeader className="pb-2">
              {(() => {
                const periodExports = exportHistoryByPeriodId.get(period._id) ?? [];
                const latestExport = periodExports[0];

                return (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base">
                    {period.startDate} - {period.endDate}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {period.status === "locked" ? (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Lock className="h-3 w-3" /> Locked {period.lockedAt ? new Date(period.lockedAt).toLocaleDateString() : ""}
                      </span>
                    ) : (
                      <Badge variant="outline">Open</Badge>
                    )}
                  </CardDescription>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {latestExport
                      ? `Latest export ${new Date(latestExport.createdAt).toLocaleString()} • ${periodExports.length} saved export${periodExports.length === 1 ? "" : "s"}`
                      : "No saved exports for this period yet."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <PayrollExportButton periodId={period._id} startDate={period.startDate} endDate={period.endDate} siteId={siteId} />

                  {period.status === "locked" ? (
                    <Button size="sm" variant="outline" onClick={() => onViewExceptions(period)}>
                      <AlertTriangle className="mr-2 h-3 w-3" />
                      Exceptions
                    </Button>
                  ) : null}

                  {period.status === "open" ? (
                    <Button size="sm" variant="secondary" disabled={lockingPeriodId === period._id} onClick={() => onLockPeriod(period._id)}>
                      <Lock className="mr-2 h-3 w-3" />
                      {lockingPeriodId === period._id ? "Locking..." : "Lock"}
                    </Button>
                  ) : null}
                </div>
              </div>
                );
              })()}
            </CardHeader>
          </Card>
        ))
      )}
    </div>
  );
}
