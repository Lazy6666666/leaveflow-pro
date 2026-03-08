import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const tools = [
  {
    type: "function",
    function: {
      name: "get_leave_balance",
      description:
        "Get the authenticated user's leave balances for the current year, showing each leave type and remaining days.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_holidays",
      description: "Get the list of upcoming public holidays.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_leave_requests",
      description:
        "Get the authenticated user's leave requests. Optionally filter by status.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["pending", "approved", "rejected", "cancelled"],
            description: "Optional status filter",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "submit_leave_request",
      description:
        "Submit a new leave request on behalf of the authenticated user. Requires leave type name, start date, and end date.",
      parameters: {
        type: "object",
        properties: {
          leave_type_name: {
            type: "string",
            description: "Name of the leave type (e.g. Annual Leave, Sick Leave)",
          },
          start_date: {
            type: "string",
            description: "Start date in YYYY-MM-DD format",
          },
          end_date: {
            type: "string",
            description: "End date in YYYY-MM-DD format",
          },
          reason: {
            type: "string",
            description: "Optional reason for the leave",
          },
        },
        required: ["leave_type_name", "start_date", "end_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_team_calendar",
      description:
        "For managers: get team members' upcoming approved leave requests for the next 30 days.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pending_approvals",
      description:
        "For managers: get pending leave requests from direct reports that need approval.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_smart_leave_suggestions",
      description:
        "Analyze upcoming public holidays and the user's leave balance to suggest optimal days off that maximize consecutive time away (long weekends, bridge days, etc.).",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

const systemPrompt = `You are the Leave Management Assistant. You help employees manage their time off.

You can:
- Check leave balances
- View upcoming public holidays
- **Suggest smart leave days** — recommend optimal days off to maximize long weekends and bridge holidays
- Submit leave requests
- View leave request history
- For managers: view team calendar and pending approvals

Today's date is ${new Date().toISOString().split("T")[0]}.

Guidelines:
- Be concise and helpful
- When showing dates, use a readable format (e.g. "Friday, April 3")
- When the user wants to submit leave, confirm the details before calling the tool
- If the user asks something outside leave management, politely redirect
- Format responses with markdown for readability
- When showing balances, use a clean table or list format
- When suggesting leave, present each suggestion clearly with the holiday name, dates to take off, total consecutive days off, and leave days used. Highlight the best value suggestions.`;

async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  switch (toolName) {
    case "get_leave_balance": {
      const year = new Date().getFullYear();
      const { data, error } = await supabase
        .from("leave_balances")
        .select("balance, leave_types(name)")
        .eq("employee_id", userId)
        .eq("year", year);
      if (error) return { error: error.message };
      return { balances: data };
    }

    case "get_holidays": {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("public_holidays")
        .select("name, date, description, is_recurring")
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(15);
      if (error) return { error: error.message };
      return { holidays: data };
    }

    case "get_my_leave_requests": {
      let query = supabase
        .from("leave_requests")
        .select("id, start_date, end_date, status, reason, leave_types(name)")
        .eq("employee_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (args.status) {
        query = query.eq("status", args.status as string);
      }
      const { data, error } = await query;
      if (error) return { error: error.message };
      return { requests: data };
    }

    case "submit_leave_request": {
      const { leave_type_name, start_date, end_date, reason } = args as {
        leave_type_name: string;
        start_date: string;
        end_date: string;
        reason?: string;
      };
      // Look up leave type
      const { data: leaveTypes, error: ltError } = await supabase
        .from("leave_types")
        .select("id")
        .ilike("name", leave_type_name)
        .eq("is_active", true)
        .limit(1);
      if (ltError) return { error: ltError.message };
      if (!leaveTypes || leaveTypes.length === 0) {
        return { error: `Leave type "${leave_type_name}" not found. Please check available leave types.` };
      }
      const { data, error } = await supabase
        .from("leave_requests")
        .insert({
          employee_id: userId,
          leave_type_id: leaveTypes[0].id,
          start_date,
          end_date,
          reason: reason || null,
          status: "pending",
        })
        .select("id, start_date, end_date, status")
        .single();
      if (error) return { error: error.message };
      return { success: true, request: data };
    }

    case "get_team_calendar": {
      const today = new Date().toISOString().split("T")[0];
      const thirtyDaysOut = new Date(Date.now() + 30 * 86400000)
        .toISOString()
        .split("T")[0];
      const { data, error } = await supabase
        .from("leave_requests")
        .select("start_date, end_date, status, profiles(full_name), leave_types(name)")
        .eq("status", "approved")
        .lte("start_date", thirtyDaysOut)
        .gte("end_date", today)
        .limit(50);
      if (error) return { error: error.message };
      if (!data || data.length === 0) {
        return { message: "No team members have approved leave in the next 30 days." };
      }
      return { team_leave: data };
    }

    case "get_pending_approvals": {
      const { data, error } = await supabase
        .from("leave_requests")
        .select("id, start_date, end_date, reason, profiles(full_name), leave_types(name)")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(20);
      if (error) return { error: error.message };
      return { pending_requests: data };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();

    // Build messages for AI
    let aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // Loop for tool calling (max 5 iterations)
    for (let i = 0; i < 5; i++) {
      const aiResponse = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: aiMessages,
            tools,
            stream: true,
          }),
        }
      );

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const text = await aiResponse.text();
        console.error("AI gateway error:", status, text);
        return new Response(JSON.stringify({ error: "AI service error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Collect the streamed response to check for tool calls
      const reader = aiResponse.body!.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let toolCalls: Array<{ id: string; function: { name: string; arguments: string } }> = [];
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.content) fullContent += delta.content;
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                if (!toolCalls[idx]) {
                  toolCalls[idx] = {
                    id: tc.id || "",
                    function: { name: tc.function?.name || "", arguments: "" },
                  };
                }
                if (tc.id) toolCalls[idx].id = tc.id;
                if (tc.function?.name) toolCalls[idx].function.name = tc.function.name;
                if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
              }
            }
          } catch {
            // partial JSON, skip
          }
        }
      }

      // If no tool calls, stream the final response
      if (toolCalls.length === 0 || toolCalls.every((tc) => !tc.function.name)) {
        // Re-request without tools for a clean stream
        const finalResponse = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: aiMessages,
              stream: true,
            }),
          }
        );

        if (!finalResponse.ok) {
          return new Response(JSON.stringify({ error: "AI service error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(finalResponse.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      // Execute tool calls
      aiMessages.push({
        role: "assistant",
        content: fullContent || null,
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: tc.function,
        })),
      } as any);

      for (const tc of toolCalls) {
        if (!tc.function.name) continue;
        let args = {};
        try {
          args = JSON.parse(tc.function.arguments || "{}");
        } catch {
          args = {};
        }
        const result = await executeTool(tc.function.name, args, supabase, userId);
        aiMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        } as any);
      }
      // Continue loop to get AI's final response with tool results
    }

    // If we exhausted iterations
    return new Response(JSON.stringify({ error: "Too many tool iterations" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat-leave error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
