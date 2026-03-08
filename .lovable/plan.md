

## Multi-Vendor Biometrics Integration — Plug & Play System

### Concept

Build a vendor adapter framework where HR admins select their biometrics device brand from a dropdown, enter their API credentials, and the system automatically handles the data mapping. Each vendor gets an "adapter" in the edge function that translates their specific API format into your unified `attendance_logs` schema.

### Architecture

```text
HR Admin Settings Page
  → Pick vendor (ZKTeco, BioTime, Suprema, HikVision, etc.)
  → Enter API URL + credentials
  → Test connection button
          │
          ▼
   biometrics_config table
   (vendor, api_url, credentials, status)
          │
          ▼
   sync-attendance edge function
   ├─ ZKTeco adapter
   ├─ BioTime adapter
   ├─ Suprema adapter
   ├─ HikVision adapter
   └─ Generic webhook adapter
          │
          ▼
   attendance_logs (unified schema, source = vendor name)
```

### What We'll Build

**1. Database: `biometrics_config` table**
- Stores vendor selection, API URL, encrypted credentials, sync frequency, connection status, last sync timestamp
- RLS: only HR admins can read/write
- Supports multiple devices (one row per device/location)

**2. Vendor Adapter System in Edge Function**
- Refactor `sync-attendance` to load config from `biometrics_config`, then route to the correct adapter
- Each adapter implements: `testConnection()`, `fetchAttendanceLogs(date)`, `mapToSchema(rawData)`
- Supported vendors (stub adapters ready for real API calls):
  - **ZKTeco** — REST API polling (`/api/transaction/`)
  - **BioTime** — Cloud API (`/api/v1/transactions/`)
  - **Suprema BioStar 2** — REST API (`/api/v2/events/`)
  - **HikVision** — ISAPI integration
  - **Generic Webhook** — for any vendor that can POST events

**3. HR Admin Settings UI**
- New page: `/admin/biometrics-settings`
- Vendor picker with logos/descriptions
- Form fields adapt per vendor (API URL, API key, device serial, etc.)
- "Test Connection" button that calls the edge function to validate credentials
- Sync status indicator (last sync time, record count, errors)
- Enable/disable toggle per device

**4. Webhook Receiver**
- Unique webhook URL per configured device
- Validates vendor-specific signatures
- Maps incoming payloads to `attendance_logs` in real-time

### Implementation Steps

1. **Create `biometrics_config` table** with columns: `id`, `vendor` (enum), `name`, `api_url`, `api_key_secret_name`, `device_serial`, `sync_frequency`, `is_active`, `last_sync_at`, `last_sync_status`, `created_at` — HR admin RLS only
2. **Build vendor adapter edge function** — refactor `sync-attendance` with adapter pattern, add `test-connection` action and per-vendor mapping stubs
3. **Create Biometrics Settings admin page** — vendor picker, credential form, test connection, device list with status
4. **Add webhook receiver** — unique endpoint per device config, vendor-specific payload parsing
5. **Add sidebar nav link** for HR admins to access biometrics settings

### Vendor-Specific Details (Stub Adapters)

Each adapter will have placeholder API calls with documented endpoints, so when users provide real credentials, they just work:

| Vendor | API Style | Key Endpoints |
|--------|-----------|---------------|
| ZKTeco | REST + polling | `/iclock/api/transactions/` |
| BioTime | Cloud REST | `/api/v1/transactions/` |
| Suprema | REST (BioStar 2) | `/api/v2/events/search` |
| HikVision | ISAPI/REST | `/ISAPI/AccessControl/AcsEvent` |
| Generic | Webhook POST | Custom payload mapping |

### What Users Experience

1. HR admin goes to Biometrics Settings
2. Clicks "Add Device" → picks vendor from list
3. Fills in API URL and credentials
4. Clicks "Test Connection" → sees success/failure
5. Enables sync → attendance logs start flowing automatically
6. Dashboard shows `source: "zkteco"` instead of `source: "manual"`

