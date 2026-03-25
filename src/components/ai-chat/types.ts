export type AssistantSource = "puter" | "mistral" | "deterministic" | "system";

export type AssistantSourceReason =
  | "puter"
  | "mistral"
  | "missing_api_key"
  | "rate_limited"
  | "transport_error"
  | "http_error"
  | "parse_error"
  | "tool_round_exhausted";

export type Msg = {
  role: "user" | "assistant";
  content: string;
  source?: AssistantSource;
  sourceReason?: AssistantSourceReason;
};

export type QuickAction = { label: string; message: string };

export type PromptRequest = {
  id: string;
  prompt: string;
};

export type AssistantBlock =
  | { type: "markdown"; content: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | {
      type: "anomaly_cards";
      anomalies: { name: string; date: string; status: string; hasClockOut: boolean }[];
    };

