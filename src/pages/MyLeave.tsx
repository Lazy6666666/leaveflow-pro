import { useAuth } from "@/contexts/AuthContext";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeaderSkeleton, BalanceCardSkeleton } from "@/components/skeletons";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useEffect } from "react";

interface LeaveBalance {
  balance: number;
  leave_type_id: string;
  year: number;
  leave_types: { name: string; annual_allocation: number; carry_forward_limit: number } | null;
}

const MyLeave = () => {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const { trackOnce } = useAnalytics();

  const { data: balances = [], isLoading } = useQuery({
    queryKey: ["leave-balances", user?.id, currentYear],
    queryFn: async () => (await convex.query(api.leave.getMyBalances, { year: currentYear })) as LeaveBalance[],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isLoading) {
      void trackOnce(`my_leave_viewed:${currentYear}`, "my_leave_viewed", {
        balance_count: balances.length,
        current_year: currentYear,
      }, { surface: "leave", path: "/my-leave" });
    }
  }, [balances.length, currentYear, isLoading, trackOnce]);

  if (isLoading) return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => <BalanceCardSkeleton key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Leave</p>
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">My Leave</h1>
        <p className="text-sm text-muted-foreground">Your leave balances for {currentYear}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {balances.map((b) => {
          const total = b.leave_types?.annual_allocation || 0;
          const used = total - b.balance;
          const pct = total > 0 ? (b.balance / total) * 100 : 0;
          return (
            <Card key={b.leave_type_id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider">{b.leave_types?.name}</CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {b.balance} <span className="text-base text-muted-foreground font-normal">/ {total} days</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={pct} className="h-2.5" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{used} days used</span>
                  <span>{b.balance} days remaining</span>
                </div>
                {b.leave_types?.carry_forward_limit ? (
                  <p className="text-xs text-muted-foreground/70">Up to {b.leave_types.carry_forward_limit} days can be carried forward</p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
        {balances.length === 0 && (
          <p className="text-muted-foreground col-span-full">No leave balances allocated yet. Contact HR to set up your leave allocation.</p>
        )}
      </div>
    </div>
  );
};

export default MyLeave;
