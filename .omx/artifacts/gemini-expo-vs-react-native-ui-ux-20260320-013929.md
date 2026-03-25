# Original user task

WHY WE BUILT AN EXPO NOT REACT NATIVE CAN YOU TELL ME THE DIFFERENCE ? USE $ask-gemini FOR THE UI/UX BACKED WITH $design-taste-frontend $full-output-enforcement

# Final prompt sent to Gemini CLI

You are advising on a product decision for a workforce attendance platform called LeaveFlow Pro.

Context:
- The web admin app is already built.
- We started the mobile app with Expo + React Native.
- The product will be an attendance-first employee mobile app with clock-in/out, selfie capture, geolocation/geofencing, offline queue/replay, leave requests, notifications, and account/profile flows.
- The user is asking: "Why did we build Expo instead of React Native? What is the difference?"

Please answer with these exact sections:
1. "Core distinction" - explain precisely whether Expo is separate from React Native or built on top of it.
2. "Why Expo was a sound choice here" - 5 to 8 concrete reasons for this app specifically.
3. "UI/UX implications" - how Expo affects speed of iteration, design quality, native feel, performance, camera/location/offline flows, and launch risk.
4. "When bare React Native would be better" - concrete cases where choosing bare/native React Native would be the better decision.
5. "Recommendation" - a direct verdict on whether starting with Expo was the correct choice for this repo now.

Keep it practical, opinionated, and product-focused. Do not give generic framework marketing copy.

# Gemini output (raw)

Loaded cached credentials.
[ERROR] [IDEClient] Failed to connect to IDE companion extension. Please ensure the extension is running. To install the extension, run /ide install.
Loading extension: Stitch
Registering notification handlers for server 'pencil'. Capabilities: { logging: {}, tools: {} }
Server 'pencil' has tools but did not declare 'listChanged' capability. Listening anyway for robustness...
Registering notification handlers for server 'stitch'. Capabilities: { tools: { listChanged: false } }
Server 'stitch' has tools but did not declare 'listChanged' capability. Listening anyway for robustness...
Registering notification handlers for server 'paper'. Capabilities: { tools: {} }
Server 'paper' has tools but did not declare 'listChanged' capability. Listening anyway for robustness...
Scheduling MCP context refresh...
Executing MCP context refresh...
MCP context refresh already in progress, queuing trailing execution.
MCP context refresh complete.
Coalescing burst refresh requests (300ms delay)...
Executing MCP context refresh...
MCP context refresh complete.
Skill conflict detected: "vercel-react-best-practices" from "C:\Users\NeilEdwardBaja\.agents\skills\vercel-react-best-practices\SKILL.md" is overriding the same skill from "C:\Users\NeilEdwardBaja\.gemini\skills\vercel-react-best-practices\SKILL.md".
Skill conflict detected: "remotion-best-practices" from "C:\Users\NeilEdwardBaja\.agents\skills\remotion-best-practices\SKILL.md" is overriding the same skill from "C:\Users\NeilEdwardBaja\.gemini\skills\remotion-best-practices\SKILL.md".
Skill conflict detected: "frontend-design" from "C:\Users\NeilEdwardBaja\.agents\skills\frontend-design\SKILL.md" is overriding the same skill from "C:\Users\NeilEdwardBaja\.gemini\skills\frontend-design\SKILL.md".
Skill conflict detected: "find-skills" from "C:\Users\NeilEdwardBaja\.agents\skills\find-skills\SKILL.md" is overriding the same skill from "C:\Users\NeilEdwardBaja\.gemini\skills\find-skills\SKILL.md".
[LocalLiteRtLmClient] Failed to generate content: Error: exception TypeError: fetch failed sending request
[Routing] GemmaClassifierStrategy failed: Error: exception TypeError: fetch failed sending request

# Concise summary

Gemini CLI is installed and callable, but the non-interactive request failed before model output due to an upstream fetch failure inside Gemini CLI's routing stack. No advisory answer was returned.

# Action items / next steps

1. Treat the skill as attempted but unavailable for this turn because the local Gemini CLI request failed upstream.
2. Answer the user directly from the repo context and mobile architecture rationale.
3. If Gemini-backed validation is still required later, retry once the CLI network/routing issue is resolved.
