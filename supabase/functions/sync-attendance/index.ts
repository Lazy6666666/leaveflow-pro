import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action } = await req.json();

    if (action === "webhook") {
      // Stub: Future biometrics vendor webhook receiver
      // Parse vendor-specific payload and upsert into attendance_logs
      return new Response(
        JSON.stringify({
          success: true,
          message: "Webhook endpoint ready. Configure your biometrics vendor to POST attendance events here.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "sync") {
      // Stub: Future biometrics API polling
      // 1. Fetch credentials from secrets
      // 2. Call vendor API for today's attendance
      // 3. Map vendor data to attendance_logs schema
      // 4. Upsert records
      return new Response(
        JSON.stringify({
          success: true,
          message: "Sync endpoint ready. Add biometrics vendor API credentials to enable automatic sync.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "auto_mark_absent") {
      // Mark employees who didn't clock in today as absent
      const today = new Date().toISOString().split("T")[0];

      // Get all employees
      const { data: employees } = await supabase
        .from("profiles")
        .select("id");

      if (!employees) {
        return new Response(
          JSON.stringify({ success: true, marked: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get today's logs
      const { data: todayLogs } = await supabase
        .from("attendance_logs")
        .select("employee_id")
        .eq("date", today);

      const loggedIds = new Set((todayLogs || []).map((l: any) => l.employee_id));

      // Get approved leave for today
      const { data: onLeave } = await supabase
        .from("leave_requests")
        .select("employee_id")
        .eq("status", "approved")
        .lte("start_date", today)
        .gte("end_date", today);

      const leaveIds = new Set((onLeave || []).map((l: any) => l.employee_id));

      // Insert absent/on_leave for those missing
      const inserts = employees
        .filter((e: any) => !loggedIds.has(e.id))
        .map((e: any) => ({
          employee_id: e.id,
          date: today,
          status: leaveIds.has(e.id) ? "on_leave" : "absent",
          source: "system",
        }));

      if (inserts.length > 0) {
        await supabase.from("attendance_logs").upsert(inserts, {
          onConflict: "employee_id,date",
        });
      }

      return new Response(
        JSON.stringify({ success: true, marked: inserts.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use: webhook, sync, or auto_mark_absent" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
