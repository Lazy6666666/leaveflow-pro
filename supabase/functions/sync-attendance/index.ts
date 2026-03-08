import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Vendor Adapters ───────────────────────────────────────────────────────────
// Each adapter implements: testConnection, fetchLogs, mapToSchema

interface AttendanceRecord {
  employee_identifier: string; // badge ID, employee code, etc.
  timestamp: string;
  type: "in" | "out";
  device_serial?: string;
}

interface VendorAdapter {
  testConnection(config: any): Promise<{ success: boolean; message: string }>;
  fetchLogs(config: any, date: string): Promise<AttendanceRecord[]>;
}

const zktecoAdapter: VendorAdapter = {
  async testConnection(config) {
    try {
      const res = await fetch(`${config.api_url}/iclock/api/terminals/`, {
        headers: { Authorization: `Token ${config.api_key}` },
      });
      if (res.ok) return { success: true, message: `Connected. Found ZKTeco server at ${config.api_url}` };
      return { success: false, message: `ZKTeco responded with status ${res.status}` };
    } catch (e) {
      return { success: false, message: `Cannot reach ZKTeco server: ${e.message}` };
    }
  },
  async fetchLogs(config, date) {
    const res = await fetch(
      `${config.api_url}/iclock/api/transactions/?start_time=${date} 00:00:00&end_time=${date} 23:59:59&page_size=1000`,
      { headers: { Authorization: `Token ${config.api_key}` } }
    );
    if (!res.ok) throw new Error(`ZKTeco API error: ${res.status}`);
    const data = await res.json();
    return (data.data || data.results || []).map((r: any) => ({
      employee_identifier: r.emp_code || r.pin,
      timestamp: r.punch_time || r.att_date,
      type: (r.punch_state === "0" || r.punch_state === 0) ? "in" : "out",
      device_serial: r.terminal_sn,
    }));
  },
};

const biotimeAdapter: VendorAdapter = {
  async testConnection(config) {
    try {
      const res = await fetch(`${config.api_url}/api/v1/device/`, {
        headers: { "Content-Type": "application/json", Authorization: `JWT ${config.api_key}` },
      });
      if (res.ok) return { success: true, message: `Connected to BioTime Cloud at ${config.api_url}` };
      return { success: false, message: `BioTime responded with status ${res.status}` };
    } catch (e) {
      return { success: false, message: `Cannot reach BioTime: ${e.message}` };
    }
  },
  async fetchLogs(config, date) {
    const res = await fetch(
      `${config.api_url}/api/v1/transactions/?start_time=${date}&end_time=${date}&page_size=1000`,
      { headers: { Authorization: `JWT ${config.api_key}` } }
    );
    if (!res.ok) throw new Error(`BioTime API error: ${res.status}`);
    const data = await res.json();
    return (data.data || []).map((r: any) => ({
      employee_identifier: r.emp_code,
      timestamp: r.punch_time,
      type: r.punch_state === "0" ? "in" : "out",
      device_serial: r.terminal_sn,
    }));
  },
};

const supremaAdapter: VendorAdapter = {
  async testConnection(config) {
    try {
      const res = await fetch(`${config.api_url}/api/v2/server/info`, {
        headers: { "bs-session-id": config.api_key },
      });
      if (res.ok) return { success: true, message: `Connected to Suprema BioStar 2` };
      return { success: false, message: `Suprema responded with status ${res.status}` };
    } catch (e) {
      return { success: false, message: `Cannot reach Suprema: ${e.message}` };
    }
  },
  async fetchLogs(config, date) {
    const res = await fetch(`${config.api_url}/api/v2/events/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "bs-session-id": config.api_key },
      body: JSON.stringify({
        Query: { limit: 1000, conditions: [
          { column: "datetime", operator: 2, values: [`${date}T00:00:00`] },
          { column: "datetime", operator: 3, values: [`${date}T23:59:59`] },
        ] },
      }),
    });
    if (!res.ok) throw new Error(`Suprema API error: ${res.status}`);
    const data = await res.json();
    return (data.EventCollection?.rows || []).map((r: any) => ({
      employee_identifier: r.user_id?.user_id || r.user_id,
      timestamp: r.datetime,
      type: r.event_type_id?.code?.includes("ENTRY") ? "in" : "out",
      device_serial: r.device_id?.id,
    }));
  },
};

const hikvisionAdapter: VendorAdapter = {
  async testConnection(config) {
    try {
      const res = await fetch(`${config.api_url}/ISAPI/System/deviceInfo`, {
        headers: { Authorization: `Basic ${btoa(`${config.api_key}:${config.api_secret || ""}`)}` },
      });
      if (res.ok) return { success: true, message: `Connected to HikVision device` };
      return { success: false, message: `HikVision responded with status ${res.status}` };
    } catch (e) {
      return { success: false, message: `Cannot reach HikVision: ${e.message}` };
    }
  },
  async fetchLogs(config, date) {
    const res = await fetch(`${config.api_url}/ISAPI/AccessControl/AcsEvent?format=json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${config.api_key}:${config.api_secret || ""}`)}`,
      },
      body: JSON.stringify({
        AcsEventCond: {
          searchID: crypto.randomUUID(),
          searchResultPosition: 0,
          maxResults: 1000,
          startTime: `${date}T00:00:00Z`,
          endTime: `${date}T23:59:59Z`,
        },
      }),
    });
    if (!res.ok) throw new Error(`HikVision API error: ${res.status}`);
    const data = await res.json();
    return (data.AcsEvent?.InfoList || []).map((r: any) => ({
      employee_identifier: r.employeeNoString || r.cardNo,
      timestamp: r.time,
      type: r.currentEvent?.includes("Entry") ? "in" : "out",
      device_serial: r.deviceName,
    }));
  },
};

const adapters: Record<string, VendorAdapter> = {
  zkteco: zktecoAdapter,
  biotime: biotimeAdapter,
  suprema: supremaAdapter,
  hikvision: hikvisionAdapter,
};

// ─── Main Handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, config_id, date, payload, vendor: webhookVendor } = await req.json();

    // ── Test Connection ──────────────────────────────────────────────────────
    if (action === "test_connection") {
      if (!config_id) {
        return new Response(
          JSON.stringify({ success: false, message: "config_id required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const { data: config } = await supabase
        .from("biometrics_config")
        .select("*")
        .eq("id", config_id)
        .single();

      if (!config) {
        return new Response(
          JSON.stringify({ success: false, message: "Config not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const adapter = adapters[config.vendor];
      if (!adapter) {
        return new Response(
          JSON.stringify({ success: false, message: `No adapter for vendor: ${config.vendor}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await adapter.testConnection(config);

      await supabase.from("biometrics_config").update({
        last_sync_status: result.success ? "connected" : "connection_failed",
      }).eq("id", config_id);

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Sync Attendance from Vendor ──────────────────────────────────────────
    if (action === "sync") {
      const syncDate = date || new Date().toISOString().split("T")[0];

      // Get all active configs (or a specific one)
      let query = supabase.from("biometrics_config").select("*").eq("is_active", true);
      if (config_id) query = query.eq("id", config_id);
      const { data: configs } = await query;

      if (!configs || configs.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: "No active biometrics configs found", synced: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let totalSynced = 0;
      const results: any[] = [];

      for (const config of configs) {
        const adapter = adapters[config.vendor];
        if (!adapter) {
          results.push({ config_id: config.id, vendor: config.vendor, error: "No adapter" });
          continue;
        }

        try {
          const records = await adapter.fetchLogs(config, syncDate);

          // Map vendor records to attendance_logs
          // Group by employee: first punch = clock_in, last punch = clock_out
          const byEmployee: Record<string, { clockIn: string; clockOut: string | null }> = {};
          for (const rec of records) {
            if (!byEmployee[rec.employee_identifier]) {
              byEmployee[rec.employee_identifier] = { clockIn: rec.timestamp, clockOut: null };
            }
            const existing = byEmployee[rec.employee_identifier];
            if (new Date(rec.timestamp) < new Date(existing.clockIn)) {
              existing.clockIn = rec.timestamp;
            }
            if (!existing.clockOut || new Date(rec.timestamp) > new Date(existing.clockOut)) {
              existing.clockOut = rec.timestamp;
            }
          }

          // Look up employee IDs from profiles (match by email or employee code stored in extra)
          // For now, we'll try to match by the identifier — this can be customized per deployment
          const inserts = [];
          for (const [identifier, times] of Object.entries(byEmployee)) {
            // Try to find employee by matching identifier to profile
            // This is a simplified lookup — real deployments may use a mapping table
            const { data: profile } = await supabase
              .from("profiles")
              .select("id")
              .or(`email.eq.${identifier},full_name.eq.${identifier}`)
              .limit(1)
              .single();

            if (profile) {
              inserts.push({
                employee_id: profile.id,
                date: syncDate,
                clock_in: times.clockIn,
                clock_out: times.clockOut,
                status: "present",
                source: config.vendor,
                notes: `Synced from ${config.name}`,
              });
            }
          }

          if (inserts.length > 0) {
            await supabase.from("attendance_logs").upsert(inserts, {
              onConflict: "employee_id,date",
            });
          }

          totalSynced += inserts.length;

          await supabase.from("biometrics_config").update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: "success",
            last_sync_records: inserts.length,
          }).eq("id", config.id);

          results.push({ config_id: config.id, vendor: config.vendor, synced: inserts.length });
        } catch (e) {
          await supabase.from("biometrics_config").update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: `error: ${e.message}`,
            last_sync_records: 0,
          }).eq("id", config.id);

          results.push({ config_id: config.id, vendor: config.vendor, error: e.message });
        }
      }

      return new Response(
        JSON.stringify({ success: true, total_synced: totalSynced, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Webhook Receiver ─────────────────────────────────────────────────────
    if (action === "webhook") {
      // Generic webhook — payload should contain: employee_identifier, timestamp, type
      if (!payload || !webhookVendor) {
        return new Response(
          JSON.stringify({ success: false, message: "payload and vendor required for webhook" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find matching config
      const { data: config } = await supabase
        .from("biometrics_config")
        .select("*")
        .eq("vendor", webhookVendor === "generic" ? "generic_webhook" : webhookVendor)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (!config) {
        return new Response(
          JSON.stringify({ success: false, message: "No active config for this vendor" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const today = new Date().toISOString().split("T")[0];
      const records = Array.isArray(payload) ? payload : [payload];

      let processed = 0;
      for (const rec of records) {
        const identifier = rec.employee_identifier || rec.emp_code || rec.badge_id;
        const timestamp = rec.timestamp || rec.punch_time || new Date().toISOString();
        const punchType = rec.type || (rec.punch_state === "0" ? "in" : "out");

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .or(`email.eq.${identifier},full_name.eq.${identifier}`)
          .limit(1)
          .single();

        if (profile) {
          const recordDate = timestamp.split("T")[0] || today;
          if (punchType === "in") {
            await supabase.from("attendance_logs").upsert({
              employee_id: profile.id,
              date: recordDate,
              clock_in: timestamp,
              status: "present",
              source: config.vendor,
            }, { onConflict: "employee_id,date" });
          } else {
            await supabase.from("attendance_logs").update({
              clock_out: timestamp,
            }).eq("employee_id", profile.id).eq("date", recordDate);
          }
          processed++;
        }
      }

      return new Response(
        JSON.stringify({ success: true, processed }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Auto Mark Absent ─────────────────────────────────────────────────────
    if (action === "auto_mark_absent") {
      const today = new Date().toISOString().split("T")[0];

      const { data: employees } = await supabase.from("profiles").select("id");
      if (!employees) {
        return new Response(
          JSON.stringify({ success: true, marked: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: todayLogs } = await supabase
        .from("attendance_logs")
        .select("employee_id")
        .eq("date", today);

      const loggedIds = new Set((todayLogs || []).map((l: any) => l.employee_id));

      const { data: onLeave } = await supabase
        .from("leave_requests")
        .select("employee_id")
        .eq("status", "approved")
        .lte("start_date", today)
        .gte("end_date", today);

      const leaveIds = new Set((onLeave || []).map((l: any) => l.employee_id));

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
      JSON.stringify({ error: "Unknown action. Use: test_connection, sync, webhook, or auto_mark_absent" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
