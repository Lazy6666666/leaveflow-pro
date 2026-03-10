

## Selfie Check-In/Check-Out Feature

Yes, this is absolutely possible. The browser's `navigator.mediaDevices.getUserMedia` API gives access to the device camera directly in the web app. Here's the plan:

### Database Changes

1. **Add columns to `attendance_logs`**: `selfie_clock_in` (text, nullable) and `selfie_clock_out` (text, nullable) to store file paths in storage.

2. **Add setting to `attendance_settings`**: `require_selfie` (boolean, default false) so HR admins can toggle the feature on/off per organization.

3. **Add storage bucket**: Create an `attendance-selfies` private bucket with RLS so employees can upload their own selfies and HR admins can view all.

### New Component: `SelfieCaptureDialog`

A dialog/modal that:
- Opens the device camera using `navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })`
- Shows a live video preview with a circular frame overlay
- Has a "Capture" button that grabs a frame from the `<video>` element onto a `<canvas>`, converts to a Blob
- Uploads the blob to the `attendance-selfies` bucket under `{user_id}/{date}_{clock_in|clock_out}.jpg`
- Returns the storage path to the parent component
- Has a "Retake" option before confirming
- Handles permission denied gracefully with a clear message

### ClockInOutWidget Changes

- On mount, fetch `attendance_settings.require_selfie`
- When `require_selfie` is true, clicking "Clock In" or "Clock Out" opens the `SelfieCaptureDialog` first
- After selfie is captured and uploaded, proceed with the existing clock-in/clock-out logic, saving the selfie path to the new column
- When `require_selfie` is false, behavior is unchanged (the feature is optional)

### AttendanceSettings Changes

- Add a new toggle in the Automation section: "Require selfie on clock in/out"
- Description: "Employees must take a selfie when clocking in and out for identity verification"

### Admin Visibility

- In the `AttendanceDashboard` and `AttendanceHistory` pages, show a small camera icon next to records that have selfies
- Clicking the icon opens the selfie in a lightbox dialog (fetched via signed URL from the private bucket)

### Storage RLS Policies

```sql
-- Employees can upload to their own folder
CREATE POLICY "Employees upload own selfies"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attendance-selfies' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Employees can view own selfies
CREATE POLICY "Employees view own selfies"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'attendance-selfies' AND (storage.foldername(name))[1] = auth.uid()::text);

-- HR admins can view all selfies
CREATE POLICY "HR admins view all selfies"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'attendance-selfies' AND has_role(auth.uid(), 'hr_admin'));
```

### Files to Create/Edit

| File | Action |
|------|--------|
| `src/components/attendance/SelfieCaptureDialog.tsx` | **Create** -- camera UI, capture, upload |
| `src/components/attendance/ClockInOutWidget.tsx` | **Edit** -- integrate selfie flow |
| `src/pages/admin/AttendanceSettings.tsx` | **Edit** -- add selfie toggle |
| `src/pages/admin/AttendanceDashboard.tsx` | **Edit** -- show selfie indicator |
| `src/pages/AttendanceHistory.tsx` | **Edit** -- show selfie indicator |
| Migration SQL | **Create** -- add columns, setting, storage bucket + policies |

### Mobile Considerations

- `facingMode: "user"` defaults to front camera on mobile
- The capture dialog will be full-width on small screens
- Works on all modern browsers (Chrome, Safari, Firefox) on both desktop and mobile

