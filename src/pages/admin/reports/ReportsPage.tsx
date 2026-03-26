import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Activity, Flame, MousePointerClick, ShieldAlert, Users, Wallet } from "lucide-react";
import type { FunctionReturnType } from "convex/server";

import { PageHeaderSkeleton, CardSkeleton } from "@/components/skeletons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/convexApi";
import { convex } from "@/lib/convex";
import { PayrollExceptionPanel, type PayrollException } from "@/components/payroll/PayrollExceptionPanel";
import { useConvexMutation } from "@/hooks/useConvexMutation";
import { useConvexParallelQuery } from "@/hooks/useConvexParallelQuery";
import { useAnalytics } from "@/hooks/useAnalytics";
import { getErrorMessage } from "@/lib/errors";

import type { AnalyticsSummary, BurnoutSummary, CountDatum, CoverageSummary, MonthlyDatum, PayrollSummary, SummaryCard } from "../reportsTypes";
import { exportReportsCsv, formatAmount, formatRangeLabel, isoDate } from "../reportsUtils";
import { OverviewTab } from "./OverviewTab";
import { PayrollPeriodsTab } from "./PayrollPeriodsTab";
import { ReportsHeader } from "./ReportsHeader";

type PayrollPeriod = FunctionReturnType<typeof api.payroll.getPayrollPeriods>[number];
type PayrollExportRecord = FunctionReturnType<typeof api.payroll.getPayrollExportHistory>[number];
type SiteOption = FunctionReturnType<typeof api.sites.listSites>[number];

export function ReportsPage() {
  const { track, trackOnce } = useAnalytics();
  const [siteFilter, setSiteFilter] = useState("all");
  const [lockingPeriodId, setLockingPeriodId] = useState<PayrollPeriod["_id"] | null>(null);
  const [exceptionsPanel, setExceptionsPanel] = useState<{
    open: boolean;
    periodId: PayrollPeriod["_id"] | null;
    periodLabel: string;
    loading: boolean;
    exceptions: PayrollException[];
  }>({ open: false, periodId: null, periodLabel: "", loading: false, exceptions: [] });
  const [resolvingExceptionId, setResolvingExceptionId] = useState<string | null>(null);
  const exceptionsLoadSeq = useRef(0);

  const payrollRange = useMemo(() => {
    const today = new Date();
    return {
      startDate: isoDate(new Date(today.getFullYear(), today.getMonth(), 1)),
      endDate: isoDate(today),
    };
  }, []);

  const coverageRange = useMemo(() => {
    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + 13);
    return {
      startDate: isoDate(today),
      endDate: isoDate(end),
    };
  }, []);

  const { data, loading: pageLoading, error: errorMessage, refetch } = useConvexParallelQuery(
    {
      reportData: [api.admin.getReportsData, { siteId: siteFilter === "all" ? undefined : siteFilter }],
      payrollData: [api.payroll.getPayrollSummary, { ...payrollRange, siteId: siteFilter === "all" ? undefined : siteFilter }],
      burnoutData: [api.insights.getBurnoutSummary, { siteId: siteFilter === "all" ? undefined : siteFilter }],
      coverageData: [api.insights.checkCoverageConflict, { ...coverageRange, siteId: siteFilter === "all" ? undefined : siteFilter }],
      periodsData: [api.payroll.getPayrollPeriods, {}],
      exportHistoryData: [api.payroll.getPayrollExportHistory, { siteId: siteFilter === "all" ? undefined : siteFilter }],
      sitesData: [api.sites.listSites, {}],
    },
    [coverageRange, payrollRange, siteFilter],
  );

  const reportData = data.reportData;
  const statusData = (reportData?.statusData ?? []) as CountDatum[];
  const typeData = (reportData?.typeData ?? []) as CountDatum[];
  const monthlyData = (reportData?.monthlyData ?? []) as MonthlyDatum[];
  const attendanceData = (reportData?.attendanceData ?? []) as CountDatum[];
  const analyticsSummary = (reportData?.analyticsSummary ?? null) as AnalyticsSummary | null;
  const payrollSummary = (data.payrollData ?? null) as PayrollSummary | null;
  const burnoutSummary = (data.burnoutData ?? null) as BurnoutSummary | null;
  const coverageSummary = (data.coverageData ?? null) as CoverageSummary | null;
  const payrollPeriods = (data.periodsData ?? []) as PayrollPeriod[];
  const exportHistory = (data.exportHistoryData ?? []) as PayrollExportRecord[];
  const sites = (data.sitesData ?? []) as SiteOption[];

  const lastErrorToastRef = useRef<string | null>(null);
  useEffect(() => {
    if (!errorMessage) {
      lastErrorToastRef.current = null;
      return;
    }
    if (lastErrorToastRef.current === errorMessage) {
      return;
    }
    lastErrorToastRef.current = errorMessage;
    toast.error(errorMessage);
  }, [errorMessage]);

  useEffect(() => {
    if (pageLoading || !reportData) {
      return;
    }

    void trackOnce("reports_page_viewed", "reports_page_viewed", {
      has_payroll: Boolean(payrollSummary),
      has_burnout: Boolean(burnoutSummary),
      has_coverage: Boolean(coverageSummary),
    });
  }, [burnoutSummary, coverageSummary, pageLoading, payrollSummary, reportData, trackOnce]);

  const { mutate: lockPayrollPeriod } = useConvexMutation(api.payroll.lockPayrollPeriod, {
    successMessage: "Period locked",
    errorFallback: "Failed to lock period",
  });
  const { mutate: createPayrollPeriod, loading: creatingPeriod } = useConvexMutation(api.payroll.createPayrollPeriod, {
    successMessage: "Period created",
    errorFallback: "Failed to create period",
  });
  const { mutate: resolvePayrollException } = useConvexMutation(api.payroll.resolvePayrollException, {
    successMessage: "Exception resolved",
    errorFallback: "Failed to resolve exception",
  });

  const handleLockPeriod = async (periodId: PayrollPeriod["_id"]) => {
    setLockingPeriodId(periodId);
    try {
      const result = await lockPayrollPeriod({ periodId });
      if (result !== null) {
        await refetch();
      }
    } finally {
      setLockingPeriodId(null);
    }
  };

  const handleCreatePeriod = async () => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
    const result = await createPayrollPeriod({ startDate, endDate });
    if (result !== null) {
      await refetch();
    }
  };

  const loadExceptionsForPeriod = async (period: PayrollPeriod) => {
    const seq = ++exceptionsLoadSeq.current;
    setExceptionsPanel({
      open: true,
      periodId: period._id,
      periodLabel: `${period.startDate} - ${period.endDate}`,
      loading: true,
      exceptions: [],
    });

    try {
      const exceptions = (await convex.query(api.payroll.getPayrollExceptionsForPeriod, {
        periodId: period._id,
        siteId: siteFilter === "all" ? undefined : siteFilter,
      })) as PayrollException[];

      // Avoid writing stale results if the user opened another period quickly.
      if (seq !== exceptionsLoadSeq.current) return;

      setExceptionsPanel((s) => ({
        ...s,
        loading: false,
        exceptions,
      }));
    } catch (err) {
      if (seq !== exceptionsLoadSeq.current) return;
      setExceptionsPanel((s) => ({ ...s, loading: false }));
      toast.error(getErrorMessage(err, "Failed to load payroll exceptions"));
    }
  };

  const handleResolveException = async (exceptionId: string) => {
    setResolvingExceptionId(exceptionId);
    try {
      const result = await resolvePayrollException({ exceptionId } as { exceptionId: string });
      if (result !== null) {
        setExceptionsPanel((s) => ({
          ...s,
          exceptions: s.exceptions.map((ex) => (ex._id === exceptionId ? { ...ex, resolvedAt: Date.now() } : ex)),
        }));
      }
    } finally {
      setResolvingExceptionId(null);
    }
  };

  const burnoutRiskData = useMemo(
    () =>
      [
        { name: "High", count: burnoutSummary?.employees.filter((employee) => employee.riskLevel === "high").length ?? 0 },
        { name: "Moderate", count: burnoutSummary?.employees.filter((employee) => employee.riskLevel === "moderate").length ?? 0 },
        { name: "Low", count: burnoutSummary?.employees.filter((employee) => employee.riskLevel === "low").length ?? 0 },
      ].filter((entry) => entry.count > 0),
    [burnoutSummary],
  );

  const payrollDepartmentData = useMemo(() => {
    if (!payrollSummary) return [] as { name: string; grossPay: number }[];

    const totals = new Map<string, number>();
    for (const employee of payrollSummary.employees) {
      const key = employee.departmentName ?? "Unassigned";
      totals.set(key, (totals.get(key) ?? 0) + (employee.grossPay ?? 0));
    }

    return Array.from(totals.entries())
      .map(([name, grossPay]) => ({ name, grossPay: Number(grossPay.toFixed(2)) }))
      .sort((left, right) => right.grossPay - left.grossPay)
      .slice(0, 6);
  }, [payrollSummary]);

  const coverageDepartmentData = useMemo(() => {
    if (!coverageSummary) return [] as { name: string; conflicts: number }[];

    const totals = new Map<string, number>();
    for (const conflict of coverageSummary.conflicts) {
      totals.set(conflict.departmentName, (totals.get(conflict.departmentName) ?? 0) + 1);
    }

    return Array.from(totals.entries())
      .map(([name, conflicts]) => ({ name, conflicts }))
      .sort((left, right) => right.conflicts - left.conflicts)
      .slice(0, 6);
  }, [coverageSummary]);

  const summaryCards = useMemo<SummaryCard[]>(
    () => [
      {
        title: "Payroll estimate",
        value: formatAmount(payrollSummary?.totals.grossPay ?? 0),
        description: payrollSummary
          ? `${payrollSummary.employees.length} employees in ${formatRangeLabel(payrollSummary.startDate, payrollSummary.endDate)}`
          : "Current month to date",
        icon: Wallet,
      },
      {
        title: "Burnout watchlist",
        value: String(burnoutSummary?.atRiskCount ?? 0),
        description: burnoutSummary
          ? `${formatRangeLabel(burnoutSummary.startDate, burnoutSummary.endDate)} monitoring window`
          : "Last 30 days",
        icon: Flame,
      },
      {
        title: "Coverage conflicts",
        value: String(coverageSummary?.conflicts.length ?? 0),
        description: `${formatRangeLabel(coverageRange.startDate, coverageRange.endDate)} planning horizon`,
        icon: ShieldAlert,
      },
      {
        title: "Payroll roster",
        value: String(payrollSummary?.employees.length ?? 0),
        description: `${formatAmount(payrollSummary?.totals.payableHours ?? 0)} payable hours tracked`,
        icon: Users,
      },
    ],
    [burnoutSummary, coverageRange.endDate, coverageRange.startDate, coverageSummary, payrollSummary],
  );

  const analyticsCards = useMemo<SummaryCard[]>(
    () => [
      {
        title: "Tracked events",
        value: String(analyticsSummary?.totalEvents ?? 0),
        description: analyticsSummary ? `Last 30 days ending ${new Date(analyticsSummary.recentWindowEnd).toLocaleDateString()}` : "No event volume yet",
        icon: Activity,
      },
      {
        title: "Active users",
        value: String(analyticsSummary?.uniqueUsers ?? 0),
        description: analyticsSummary ? `${analyticsSummary.uniqueSessions} unique sessions recorded` : "No sessions recorded",
        icon: Users,
      },
      {
        title: "Top event",
        value: analyticsSummary?.topEvents[0]?.name ?? "No data",
        description: analyticsSummary?.topEvents[0] ? `${analyticsSummary.topEvents[0].count} occurrences in the current window` : "Waiting for tracked traffic",
        icon: MousePointerClick,
      },
    ],
    [analyticsSummary],
  );

  if (pageLoading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CardSkeleton lines={3} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={3} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <CardSkeleton lines={6} />
          <CardSkeleton lines={6} />
        </div>
        <CardSkeleton lines={8} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ReportsHeader
        siteFilter={siteFilter}
        sites={sites.map((site) => ({ id: String(site._id), name: site.name }))}
        onSiteFilterChange={setSiteFilter}
        onExport={() => {
          void track("reports_csv_exported", {
            sections_included: [
              "leave_status",
              "leave_type",
              "attendance",
              "monthly_leave_trends",
              "analytics",
              "payroll",
              "burnout",
              "coverage",
            ],
            site_id: siteFilter === "all" ? null : siteFilter,
          });
          exportReportsCsv({
            attendanceData,
            analyticsSummary,
            burnoutSummary,
            coverageSummary,
            monthlyData,
            payrollSummary,
            statusData,
            typeData,
          });
        }}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payroll">Payroll Periods</TabsTrigger>
        </TabsList>

        <TabsContent value="payroll">
          <PayrollPeriodsTab
            creatingPeriod={creatingPeriod}
            exportHistory={exportHistory}
            lockingPeriodId={lockingPeriodId}
            payrollPeriods={payrollPeriods}
            siteId={siteFilter === "all" ? undefined : siteFilter}
            onCreatePeriod={() => void handleCreatePeriod()}
            onLockPeriod={(periodId) => void handleLockPeriod(periodId)}
            onViewExceptions={(period) => void loadExceptionsForPeriod(period)}
          />
        </TabsContent>

        <TabsContent value="overview" className="mt-6 space-y-8">
          <OverviewTab
            errorMessage={errorMessage}
            summaryCards={summaryCards}
            analyticsCards={analyticsCards}
            analyticsSummary={analyticsSummary}
            statusData={statusData}
            typeData={typeData}
            monthlyData={monthlyData}
            attendanceData={attendanceData}
            payrollSummary={payrollSummary}
            payrollDepartmentData={payrollDepartmentData}
            burnoutSummary={burnoutSummary}
            burnoutRiskData={burnoutRiskData}
            coverageSummary={coverageSummary}
            coverageDepartmentData={coverageDepartmentData}
            coverageRange={coverageRange}
          />
        </TabsContent>
      </Tabs>

      <PayrollExceptionPanel
        open={exceptionsPanel.open}
        onClose={() => setExceptionsPanel((s) => ({ ...s, open: false }))}
        title={exceptionsPanel.periodLabel}
        loading={exceptionsPanel.loading}
        exceptions={exceptionsPanel.exceptions}
        resolvingId={resolvingExceptionId}
        onResolve={(exceptionId) => void handleResolveException(exceptionId)}
        onRefresh={() => {
          const periodId = exceptionsPanel.periodId;
          if (!periodId) return;
          const period = payrollPeriods.find((p) => p._id === periodId);
          if (!period) return;
          void loadExceptionsForPeriod(period);
        }}
      />
    </div>
  );
}
