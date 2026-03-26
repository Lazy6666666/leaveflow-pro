import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export interface PayrollException {
  _id: string;
  employeeId: string;
  employeeName: string;
  exceptionType: string;
  description: string;
  resolvedAt?: number;
  createdAt?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  loading?: boolean;
  exceptions: PayrollException[];
  onResolve?: (exceptionId: string) => void;
  resolvingId?: string | null;
  onRefresh?: () => void;
}

function humanizeExceptionType(value: string) {
  return value.replace(/_/g, " ");
}

export function PayrollExceptionPanel({
  open,
  onClose,
  title,
  loading,
  exceptions,
  onResolve,
  resolvingId,
  onRefresh,
}: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, PayrollException[]>();
    for (const ex of exceptions) {
      const key = ex.employeeName || ex.employeeId;
      const bucket = map.get(key) ?? [];
      bucket.push(ex);
      map.set(key, bucket);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [exceptions]);

  const openCount = useMemo(() => exceptions.filter((e) => !e.resolvedAt).length, [exceptions]);
  const resolvedCount = useMemo(() => exceptions.filter((e) => Boolean(e.resolvedAt)).length, [exceptions]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Payroll Exceptions: {title}</SheetTitle>
          <SheetDescription>Review and resolve payroll exceptions captured when the period was locked.</SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <div className="text-muted-foreground">{loading ? "Loading..." : `${openCount} open, ${resolvedCount} resolved`}</div>
          {onRefresh ? (
            <Button size="sm" variant="outline" disabled={loading} onClick={onRefresh}>
              Refresh
            </Button>
          ) : null}
        </div>

        <div className="mt-4 space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Fetching exceptions...</p>
          ) : exceptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exceptions for this payroll period.</p>
          ) : (
            grouped.map(([employee, items]) => (
              <div key={employee} className="space-y-2">
                <div className="text-sm font-semibold">{employee}</div>
                {items.map((ex) => (
                  <div key={ex._id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium capitalize">{humanizeExceptionType(ex.exceptionType)}</div>
                        <p className="mt-1 text-muted-foreground">{ex.description}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Badge variant={ex.resolvedAt ? "default" : "destructive"}>{ex.resolvedAt ? "Resolved" : "Open"}</Badge>
                        {!ex.resolvedAt && onResolve ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={resolvingId === ex._id}
                            onClick={() => onResolve(ex._id)}
                          >
                            {resolvingId === ex._id ? "Resolving..." : "Resolve"}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
