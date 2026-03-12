# LeaveFlow Pro: AI Scaling Phase 1 Implementation Plan

This plan bridges HR operational needs (Payroll) with advanced AI capabilities (Policy Knowledge & Predictive Insights) to turn the Leave Assistant into a proactive HR Co-pilot.

## User Review Required

> [!IMPORTANT]
> **Data Security**: Policy RAG will involve uploading company documents. We will use Convex's built-in file storage and vector search to ensure data stays within your secure infrastructure.
> 
> **Monetary Fields**: I will proceed with adding `hourlyRate` and `baseSalary` to the `profiles` table to enable actual payment calculations in payroll reports.

## Proposed Changes

### 1. Unified Backend (Convex)
---
#### [MODIFY] [schema.ts](file:///C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/schema.ts)
- **Profiles Update**: Add `hourlyRate: v.optional(v.number())` and `baseSalary: v.optional(v.number())`.
- **Policy Knowledge Table**: Create a `policyDocuments` table with vector embedding support:
  ```typescript
  policyDocuments: defineTable({
    title: v.string(),
    content: v.string(),
    embedding: v.array(v.float64()), // For vector search
    metadata: v.any()
  }).index("by_title", ["title"]).vectorIndex("by_embedding", {
    dimensions: 1536,
    vectorField: "embedding",
  })
  ```

#### [NEW] [payroll.ts](file:///C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/payroll.ts)
- `getPayrollSummary(startDate, endDate)`: Aggregates hours from `attendanceLogs`, leave types (paid/unpaid), and multiplies by profile rates.

#### [NEW] [insights.ts](file:///C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/insights.ts)
- `detectBurnout(userId)`: Scans last 30 days for >45h work weeks or <2 days off.
- `checkCoverageConflict(startDate, endDate)`: Checks if multiple employees in the same department are out simultaneously.

#### [NEW] [rag.ts](file:///C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/rag.ts)
- `searchPolicy(query)`: Performs vector search across `policyDocuments` to find relevant text snippets for the AI.

---

### 2. AI Logic (Assistant)
---
#### [MODIFY] [assistant.ts](file:///C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/convex/assistant.ts)
- **Multi-Intent Architecture**: Instead of a single context, update the `chat` handler to:
  1. Determine intent (Payroll? Policy? Balance? Insight?).
  2. Call the specific backend tool (e.g., `searchPolicy` or `getPayrollSummary`).
  3. Feed the specific result back into the prompt.
- **Role-Based Prompts**: Differentiate responses based on `hr_admin` vs `employee` role (Admins see payroll, Employees see policy + balances).

---

### 3. Frontend (UI)
---
#### [MODIFY] [AIChatPanel.tsx](file:///C:/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/src/components/AIChatPanel.tsx)
- **Dynamic Quick Actions**:
  - *Admin*: "Payroll Report", "Coverage Conflicts", "Audit Biometrics".
  - *Employee*: "Policy FAQ", "Burnout Check", "Bridge Day Suggestions".
- **Enhanced Formatting**: Support for table output in chat for payroll data.

## Verification Plan

### Automated Tests
- `convex test payroll`: Verify calculation logic.
- `convex test insights`: Verify burnout detection triggers on mock data.

### Manual Verification
1. **RAG Test**: Upload a sample "Remote Work Policy" snippet to the DB and ask the AI: *"What are the rules for working from home?"*
2. **Payroll Test**: Generate a report for an employee with both `present` and `unpaid_leave` logs.
3. **Admin Test**: Log in as Manager and ask: *"Is anyone at risk of burnout?"*
