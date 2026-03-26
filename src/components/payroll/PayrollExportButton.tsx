import { useState } from "react";
import { useMutation } from "convex/react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { FunctionReturnType } from "convex/server";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { getErrorMessage } from "@/lib/errors";

interface Props {
  periodId?: FunctionReturnType<typeof api.payroll.getPayrollPeriods>[number]["_id"];
  startDate: string;
  endDate: string;
  siteId?: string;
  disabled?: boolean;
}

export function PayrollExportButton({ periodId, startDate, endDate, siteId, disabled }: Props) {
  const [loading, setLoading] = useState(false);
  const { track } = useAnalytics();
  const recordExport = useMutation(api.payroll.recordPayrollExport);

  const handleExport = async () => {
    setLoading(true);
    try {
      const result = await convex.action(api.payroll.exportPayrollCsv, { periodId, startDate, endDate, siteId });
      const blob = new Blob([result.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.fileName;
      a.click();
      URL.revokeObjectURL(url);

      await recordExport({
        periodId,
        startDate,
        endDate,
        siteId,
        format: "csv",
        fileName: result.fileName,
        rowCount: result.rowCount,
        totalGrossPay: result.totalGrossPay,
      });

      void track("payroll_exported", {
        employee_count: result.employeeCount,
        export_format: "csv",
        period_id: periodId ?? null,
        row_count: result.rowCount,
        site_id: siteId ?? null,
        total_gross_pay: result.totalGrossPay,
      }, { surface: "reports", path: "/admin/reports" });
    } catch (error) {
      toast.error(getErrorMessage(error, "Export failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" disabled={disabled || loading} onClick={() => void handleExport()}>
      <Download className="mr-2 h-4 w-4" />
      {loading ? "Exporting..." : "Export CSV"}
    </Button>
  );
}
