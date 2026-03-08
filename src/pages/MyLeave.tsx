import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeaderSkeleton, BalanceCardSkeleton } from "@/components/skeletons";

interface LeaveBalance {
  balance: number;
  leave_type_id: string;
  year: number;
  leave_types: { name: string; annual_allocation: number; carry_forward_limit: number } | null;
}

const MyLeave = () => {
  const { user } = useAuth();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("leave_balances")
        .select("balance, leave_type_id, year, leave_types(name, annual_allocation, carry_forward_limit)")
        .eq("employee_id", user.id)
        .eq("year", currentYear);
      if (data) setBalances(data as unknown as LeaveBalance[]);
    };
    fetch();
  }, [user, currentYear]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Leave</h1>
        <p className="text-muted-foreground mt-1">Your leave balances for {currentYear}</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
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
