import type { ComponentType } from "react";
import { BarChart, Bar, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type {
  AnalyticsSummary,
  BurnoutRisk,
  BurnoutSummary,
  CountDatum,
  CoverageSummary,
  MonthlyDatum,
  PayrollSummary,
  SummaryCard,
} from "../reportsTypes";
import { formatAmount, formatRangeLabel, getRiskBadgeVariant, REPORT_COLORS, RISK_COLORS } from "../reportsUtils";

type OverviewTabProps = {
  errorMessage: string | null;
  summaryCards: SummaryCard[];
  analyticsCards: SummaryCard[];
  analyticsSummary: AnalyticsSummary | null;
  statusData: CountDatum[];
  typeData: CountDatum[];
  monthlyData: MonthlyDatum[];
  attendanceData: CountDatum[];
  payrollSummary: PayrollSummary | null;
  payrollDepartmentData: { name: string; grossPay: number }[];
  burnoutSummary: BurnoutSummary | null;
  burnoutRiskData: { name: string; count: number }[];
  coverageSummary: CoverageSummary | null;
  coverageDepartmentData: { name: string; conflicts: number }[];
  coverageRange: { startDate: string; endDate: string };
};

export function OverviewTab({
  errorMessage,
  summaryCards,
  analyticsCards,
  analyticsSummary,
  statusData,
  typeData,
  monthlyData,
  attendanceData,
  payrollSummary,
  payrollDepartmentData,
  burnoutSummary,
  burnoutRiskData,
  coverageSummary,
  coverageDepartmentData,
  coverageRange,
}: OverviewTabProps) {
  return (
    <>
      {errorMessage ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Some insights are unavailable</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon as ComponentType<{ className?: string }>;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardDescription>{card.title}</CardDescription>
                  <CardTitle className="mt-2 text-2xl">{card.value}</CardTitle>
                </div>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Product Analytics</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Adoption and conversion signals</h2>
          <p className="mt-1 text-sm text-muted-foreground">Captured from the in-product analytics pipeline over the last 30 days.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {analyticsCards.map((card) => {
            const Icon = card.icon as ComponentType<{ className?: string }>;
            return (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardDescription>{card.title}</CardDescription>
                    <CardTitle className="mt-2 text-2xl break-words">{card.value}</CardTitle>
                  </div>
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Daily Event Volume</CardTitle>
              <CardDescription>
                {analyticsSummary
                  ? `${analyticsSummary.totalEvents} tracked events from ${analyticsSummary.uniqueUsers} users across the current 30-day window.`
                  : "No analytics activity has been captured yet."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsSummary && analyticsSummary.dailyData.some((entry) => entry.events > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={analyticsSummary.dailyData} margin={{ left: 0, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} minTickGap={20} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "0.5rem",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                      }}
                    />
                    <Line type="monotone" dataKey="events" stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="uniqueUsers" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No daily analytics activity is available yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Product Funnel</CardTitle>
              <CardDescription>Counts for the core acquisition and activation milestones already instrumented.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analyticsSummary?.funnelData.map((step) => (
                <div key={step.name} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{step.name}</p>
                    <Badge variant="outline" className="tabular-nums">
                      {step.count}
                    </Badge>
                  </div>
                </div>
              ))}
              {!analyticsSummary ? <p className="text-sm text-muted-foreground">No funnel data has been recorded yet.</p> : null}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Usage by Surface</CardTitle>
              <CardDescription>Where tracked activity is happening across the product.</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsSummary && analyticsSummary.surfaceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={analyticsSummary.surfaceData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {analyticsSummary.surfaceData.map((_, index) => (
                        <Cell key={index} fill={REPORT_COLORS[index % REPORT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "0.5rem",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No surface-level analytics activity is available yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Top Tracked Events</CardTitle>
              <CardDescription>The most frequent analytics events captured during the current reporting window.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analyticsSummary?.topEvents.map((event) => (
                <div key={event.name} className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-sm text-muted-foreground">Tracked interaction volume</p>
                  </div>
                  <Badge variant="outline" className="self-start tabular-nums sm:self-auto">
                    {event.count}
                  </Badge>
                </div>
              ))}
              {analyticsSummary && analyticsSummary.topEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No event leaders are available yet.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Requests by Status</CardTitle>
            <CardDescription>Distribution of leave request statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {statusData.map((_, index) => (
                    <Cell key={index} fill={REPORT_COLORS[index % REPORT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "0.5rem",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Requests by Leave Type</CardTitle>
            <CardDescription>Usage across different leave categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={typeData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {typeData.map((_, index) => (
                    <Cell key={index} fill={REPORT_COLORS[index % REPORT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "0.5rem",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Attendance by Status</CardTitle>
            <CardDescription>Recent clock-in and clock-out signals recorded by the system</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={attendanceData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {attendanceData.map((_, index) => (
                    <Cell key={index} fill={REPORT_COLORS[index % REPORT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "0.5rem",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Monthly Leave Trends</CardTitle>
            <CardDescription>Leave requests over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "0.5rem",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                <Bar dataKey="requests" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Payroll Snapshot</CardTitle>
            <CardDescription>
              {payrollSummary
                ? `Current month-to-date payroll insight for ${formatRangeLabel(payrollSummary.startDate, payrollSummary.endDate)}.`
                : "No payroll activity for the selected window."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Gross pay</p>
                <p className="mt-2 text-2xl font-semibold">{formatAmount(payrollSummary?.totals.grossPay ?? 0)}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Payable hours</p>
                <p className="mt-2 text-2xl font-semibold">{formatAmount(payrollSummary?.totals.payableHours ?? 0)}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Paid leave days</p>
                <p className="mt-2 text-2xl font-semibold">{formatAmount(payrollSummary?.totals.paidLeaveDays ?? 0)}</p>
              </div>
            </div>

            {payrollDepartmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={payrollDepartmentData} layout="vertical" margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.5rem",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                    formatter={(value: number) => formatAmount(Number(value))}
                  />
                  <Bar dataKey="grossPay" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No department-level payroll totals are available yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Burnout Risk Monitor</CardTitle>
            <CardDescription>
              {burnoutSummary
                ? `${burnoutSummary.atRiskCount} employees flagged between ${formatRangeLabel(burnoutSummary.startDate, burnoutSummary.endDate)}.`
                : "No burnout insight available."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {burnoutRiskData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={burnoutRiskData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                    {burnoutRiskData.map((entry) => (
                      <Cell key={entry.name} fill={RISK_COLORS[entry.name.toLowerCase() as BurnoutRisk]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.5rem",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No burnout signals were detected in the current visibility scope.</p>
            )}

            <div className="space-y-3">
              {burnoutSummary?.employees
                .filter((employee) => employee.riskLevel !== "low")
                .slice(0, 5)
                .map((employee) => (
                  <div key={employee.userId} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{employee.employeeName}</p>
                        <p className="text-sm text-muted-foreground">
                          Peak weekly hours: {employee.peakWeeklyHours.toFixed(2)} - Days off: {employee.daysOff}
                        </p>
                      </div>
                      <Badge variant={getRiskBadgeVariant(employee.riskLevel)} className="capitalize">
                        {employee.riskLevel}
                      </Badge>
                    </div>
                  </div>
                ))}
              {burnoutSummary && burnoutSummary.atRiskCount === 0 ? (
                <p className="text-sm text-muted-foreground">Everyone in scope is currently at low burnout risk.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Coverage Pressure by Department</CardTitle>
            <CardDescription>
              {coverageSummary
                ? `Upcoming approved-leave overlap for ${formatRangeLabel(coverageSummary.startDate, coverageSummary.endDate)}.`
                : "No upcoming coverage insights available."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {coverageDepartmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={coverageDepartmentData} margin={{ left: 0, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.5rem",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                  <Bar dataKey="conflicts" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No overlapping department leave conflicts were found for the next two weeks.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Upcoming Coverage Conflicts</CardTitle>
            <CardDescription>Days where at least two people in the same department are already approved to be out.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {coverageSummary?.conflicts.slice(0, 6).map((conflict) => (
              <div key={`${conflict.departmentName}-${conflict.date}`} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{conflict.departmentName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatRangeLabel(conflict.date, conflict.date)} - {conflict.count} employees out
                    </p>
                  </div>
                  <Badge variant="outline">{conflict.count} impacted</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{conflict.employees.map((employee) => employee.employeeName).join(", ")}</p>
              </div>
            ))}
            {coverageSummary && coverageSummary.conflicts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No same-department leave overlaps are currently scheduled.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
