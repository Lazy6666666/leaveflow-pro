

## Add Quick Action Buttons to AI Chat Panel

Add clickable suggestion chips below the welcome message in the chat panel. When clicked, each chip sends its corresponding message as if the user typed it.

### Changes

**`src/components/AIChatPanel.tsx`**
- Add an array of quick actions: `[{label: "Check balance", message: "What's my leave balance?"}, {label: "Smart suggestions", message: "Suggest smart leave days"}, {label: "Upcoming holidays", message: "When are the upcoming holidays?"}]`
- Render them as small styled buttons below the welcome text (only when `messages.length === 0`)
- On click, set `input` to the message and call `send()` (or directly trigger send with that text)
- Hide the chips once conversation starts (already handled by the `messages.length === 0` condition)

Single file change, no backend modifications needed.

