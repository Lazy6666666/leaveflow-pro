import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const escapeHtml = (str: string) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

type PendingRequestRow = {
  id: string;
  start_date: string;
  end_date: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string | null;
    manager_id: string | null;
  } | null;
  leave_types: {
    name: string | null;
  } | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all pending leave requests with employee and manager info
    const { data: pendingRequests, error: reqErr } = await supabase
      .from("leave_requests")
      .select("id, start_date, end_date, created_at, profiles:employee_id(full_name, email, manager_id), leave_types(name)")
      .eq("status", "pending");

    if (reqErr || !pendingRequests || pendingRequests.length === 0) {
      return new Response(JSON.stringify({ message: "No pending requests" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by manager
    const managerRequests: Record<string, { managerId: string; requests: PendingRequestRow[] }> = {};
    for (const req of pendingRequests) {
      const managerId = (req as PendingRequestRow).profiles?.manager_id;
      if (!managerId) continue;
      if (!managerRequests[managerId]) {
        managerRequests[managerId] = { managerId, requests: [] };
      }
      managerRequests[managerId].requests.push(req);
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not set. Would send digest to:", Object.keys(managerRequests).length, "managers");
      
      // Still create in-app notifications even without email
      for (const [managerId, group] of Object.entries(managerRequests)) {
        const count = group.requests.length;
        await supabase.from("notifications").insert({
          user_id: managerId,
          title: "Daily Digest: Pending Approvals",
          message: `You have ${count} pending leave request${count > 1 ? "s" : ""} awaiting your review.`,
          type: "warning",
        });
      }

      return new Response(JSON.stringify({ message: "Notifications created (no email API key)" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let emailsSent = 0;

    for (const [managerId, group] of Object.entries(managerRequests)) {
      const { data: manager } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", managerId)
        .single();

      if (!manager?.email) continue;

      const count = group.requests.length;

      // Build email body
      const requestRows = group.requests.map((r) => {
        const emp = r.profiles;
        return `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(emp?.full_name || emp?.email || "Employee")}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(r.leave_types?.name || "Leave")}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(r.start_date)} — ${escapeHtml(r.end_date)}</td>
        </tr>`;
      }).join("");

      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#2d6a4f;">Daily Approval Digest</h2>
          <p>Hi ${escapeHtml(manager.full_name || "Manager")},</p>
          <p>You have <strong>${count}</strong> pending leave request${count > 1 ? "s" : ""} awaiting your review:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead>
              <tr style="background:#f0fdf4;">
                <th style="padding:8px 12px;text-align:left;">Employee</th>
                <th style="padding:8px 12px;text-align:left;">Type</th>
                <th style="padding:8px 12px;text-align:left;">Dates</th>
              </tr>
            </thead>
            <tbody>${requestRows}</tbody>
          </table>
          <p>Please log in to BALANCE to review and action these requests.</p>
          <p style="color:#888;font-size:12px;">This is an automated daily digest from BALANCE.</p>
        </div>
      `;

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "BALANCE <onboarding@resend.dev>",
          to: [manager.email],
          subject: `[BALANCE] ${count} Pending Leave Request${count > 1 ? "s" : ""} Awaiting Review`,
          html,
        }),
      });

      if (emailRes.ok) emailsSent++;

      // Also create in-app notification
      await supabase.from("notifications").insert({
        user_id: managerId,
        title: "Daily Digest: Pending Approvals",
        message: `You have ${count} pending leave request${count > 1 ? "s" : ""} awaiting your review.`,
        type: "warning",
      });
    }

    return new Response(JSON.stringify({ message: `Digest sent to ${emailsSent} managers`, total: Object.keys(managerRequests).length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("digest-pending-approvals error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
