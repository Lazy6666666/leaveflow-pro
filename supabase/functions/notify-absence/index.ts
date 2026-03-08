import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const escapeHtml = (str: string) =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { employee_ids, date } = await req.json();

    if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
      return new Response(
        JSON.stringify({ message: "No employees to notify about" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get profiles with their managers
    const { data: employees } = await supabase
      .from("profiles")
      .select("id, full_name, email, manager_id")
      .in("id", employee_ids);

    if (!employees || employees.length === 0) {
      return new Response(
        JSON.stringify({ message: "No matching employees found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group absent employees by manager
    const byManager: Record<string, { managerName: string; managerEmail: string; absentees: string[] }> = {};

    for (const emp of employees) {
      if (!emp.manager_id) continue;

      if (!byManager[emp.manager_id]) {
        const { data: manager } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", emp.manager_id)
          .single();

        if (manager?.email) {
          byManager[emp.manager_id] = {
            managerName: manager.full_name || "Manager",
            managerEmail: manager.email,
            absentees: [],
          };
        }
      }

      if (byManager[emp.manager_id]) {
        byManager[emp.manager_id].absentees.push(emp.full_name || emp.email || "Unknown");
      }
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not set. Would notify managers:", Object.keys(byManager));
      return new Response(
        JSON.stringify({ message: "Email skipped (no API key)", managers: Object.keys(byManager).length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sent = 0;
    for (const [, info] of Object.entries(byManager)) {
      const absentList = info.absentees.map((n) => `<li>${escapeHtml(n)}</li>`).join("");
      const subject = `Attendance Alert: ${info.absentees.length} team member(s) marked absent — ${date}`;
      const html = `<p>Hi ${escapeHtml(info.managerName)},</p>
<p>The following team member(s) were auto-marked as <strong>absent</strong> on <strong>${escapeHtml(date)}</strong> because they did not clock in:</p>
<ul>${absentList}</ul>
<p>Please follow up if needed.</p>
<p style="color:#888;font-size:12px;">This is an automated notification from Leave Manager.</p>`;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Leave Manager <onboarding@resend.dev>",
          to: [info.managerEmail],
          subject,
          html,
        }),
      });

      if (res.ok) sent++;
      else console.error("Failed to send to", info.managerEmail, await res.text());
    }

    return new Response(
      JSON.stringify({ success: true, managers_notified: sent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("notify-absence error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
