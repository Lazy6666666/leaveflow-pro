import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, request_id } = await req.json();
    if (!type || !request_id) {
      return new Response(JSON.stringify({ error: "Missing type or request_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to look up data
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch leave request with employee profile, manager, and leave type
    const { data: request, error: reqError } = await supabase
      .from("leave_requests")
      .select("*, profiles:employee_id(full_name, email, manager_id), leave_types(name)")
      .eq("id", request_id)
      .single();

    if (reqError || !request) {
      return new Response(JSON.stringify({ error: "Request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const employee = request.profiles;
    const leaveType = request.leave_types?.name || "Leave";

    let recipientEmail: string | null = null;
    let recipientName: string | null = null;
    let subject = "";
    let body = "";

    if (type === "submitted") {
      // Notify manager
      if (employee?.manager_id) {
        const { data: manager } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", employee.manager_id)
          .single();
        if (manager) {
          recipientEmail = manager.email;
          recipientName = manager.full_name;
          subject = `New Leave Request from ${employee.full_name || employee.email}`;
          body = `<p>Hi ${manager.full_name || "Manager"},</p>
<p><strong>${employee.full_name || employee.email}</strong> has submitted a <strong>${leaveType}</strong> request from <strong>${request.start_date}</strong> to <strong>${request.end_date}</strong>.</p>
<p>Reason: ${request.reason || "Not specified"}</p>
<p>Please review and take action.</p>`;
        }
      }
    } else if (type === "approved" || type === "rejected") {
      // Notify employee
      recipientEmail = employee?.email;
      recipientName = employee?.full_name;
      const status = type === "approved" ? "Approved" : "Rejected";
      subject = `Your ${leaveType} Request Has Been ${status}`;
      body = `<p>Hi ${employee?.full_name || "Employee"},</p>
<p>Your <strong>${leaveType}</strong> request from <strong>${request.start_date}</strong> to <strong>${request.end_date}</strong> has been <strong>${status.toLowerCase()}</strong>.</p>
${request.manager_comment ? `<p>Comment: ${request.manager_comment}</p>` : ""}`;
    }

    if (!recipientEmail) {
      return new Response(JSON.stringify({ message: "No recipient found, skipping email" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not set. Would send email to:", recipientEmail, "Subject:", subject);
      return new Response(JSON.stringify({ message: "Email skipped (no API key)" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Leave Manager <onboarding@resend.dev>",
        to: [recipientEmail],
        subject,
        html: body,
      }),
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      console.error("Resend error:", emailData);
      return new Response(JSON.stringify({ error: "Failed to send email", details: emailData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "Email sent", id: emailData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-leave error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
