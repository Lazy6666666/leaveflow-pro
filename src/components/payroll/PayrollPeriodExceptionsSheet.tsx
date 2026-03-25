import { useMemo } from "react";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export type PayrollPeriodException = {
  _id: string;
  employeeId: string;
  employeeName: string;
  exceptionType: string;
  description: string;
  resolvedAt?: number;
  createdAt?: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  periodLabel: string;
  loading: boolean;
  exceptions: PayrollPeriodException[];
  onResolve: (exceptionId: string) => void;
  resolvingId: string | null;
};

function formatExceptionType(value: string) {
  return value.replace(/_/g, " ");
}

export function PayrollPeriodExceptionsSheet({ open, onClose, periodLabel, loading, exceptions, onResolve, resolvingId }: Props) {
  const grouped = useMemo(() => {
    const byEmployee = new Map<string, PayrollPeriodException[]>();
    for (const ex of exceptions) {
      const key = ex.employeeName || ex.employeeId;
      const bucket = byEmployee.get(key) ?? [];
      bucket.push(ex);
      byEmployee.set(key, bucket);
    }

    return Array.from(byEmployee.entries()).map(([employeeName, items]) => {
      const openCount = items.filter((i) => !i.resolvedAt).length;
      return { employeeName, items, openCount };
    });
  }, [exceptions]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Payroll exceptions: {periodLabel}</SheetTitle>
        </SheetHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading exceptions...
            </div>
          ) : exceptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exceptions were recorded for this period.</p>
          ) : (
            <div className="space-y-4">
              {grouped.map((group) => (
                <div key={group.employeeName} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{group.employeeName}</p>
                      <p className="text-xs text-muted-foreground">{group.openCount} open</p>
                    </div>
                    <Badge variant={group.openCount === 0 ? "default" : "destructive"}>{group.openCount === 0 ? "Clear" : "Review"}</Badge>
                  </div>

                  <div className="mt-3 space-y-2">
                    {group.items.map((ex) => (
                      <div key={ex._id} className="rounded-md bg-muted/30 p-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium">{formatExceptionType(ex.exceptionType)}</p>
                            <p className="mt-1 text-muted-foreground">{ex.description}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <Badge variant={ex.resolvedAt ? "default" : "destructive"}>{ex.resolvedAt ? "Resolved" : "Open"}</Badge>
                            {!ex.resolvedAt ? (
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={resolvingId === ex._id}
                                  onClick={() => onResolve(ex._id)}
                                >
                                  {resolvingId === ex._id ? "Resolving..." : "Resolve"}
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}