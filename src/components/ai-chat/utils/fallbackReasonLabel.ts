import type { AssistantSourceReason } from "@/components/ai-chat/types";

export function getFallbackReasonLabel(reason?: AssistantSourceReason) {
  switch (reason) {
    case "missing_api_key":
      return "Mistral API key missing.";
    case "rate_limited":
      return "Assistant rate limit reached.";
    case "transport_error":
      return "Network call to Mistral failed.";
    case "http_error":
      return "Mistral returned an error response.";
    case "parse_error":
      return "Mistral response could not be parsed.";
    case "tool_round_exhausted":
      return "Tool loop exhausted before a final answer.";
    default:
      return "Using fallback response.";
  }
}

