import { AlertTriangle, Lock, Plus } from "lucide-react";
import type { FunctionReturnType } from "convex/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PayrollExportButton } from "@/components/payroll/PayrollExportButton";
import { api } from "@/lib/convexApi";

type PayrollPeriod = FunctionReturnType<typeof api.payroll.getPayrollPeriods>[number];

type PayrollPeriodsTabProps = {
  creatingPeriod: boolean;
  lockingPeriodId: PayrollPeriod["_id"] | null;
  payrollPeriods: PayrollPeriod[];
  siteId?: string;
  onCreatePeriod: () => void;
  onLockPeriod: (periodId: PayrollPeriod["_id"]) => void;
  onViewExceptions: (period: PayrollPeriod) => void;
};

export function PayrollPeriodsTab({
  creatingPeriod,
  lockingPeriodId,
  payrollPeriods,
  siteId,
  onCreatePeriod,
  onLockPeriod,
  onViewExceptions,
}: PayrollPeriodsTabProps) {
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
                </div>
                <div className="flex flex-wrap gap-2">
                  <PayrollExportButton startDate={period.startDate} endDate={period.endDate} siteId={siteId} />

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
            </CardHeader>
          </Card>
        ))
      )}
    </div>
  );
}
