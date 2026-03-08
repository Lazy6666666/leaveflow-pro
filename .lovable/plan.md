

## Attendance Tracking System - Foundation Plan

Since you don't have biometrics vendor details yet, we'll build a **manual attendance system** that serves as a foundation. This allows employees to clock in/out immediately, and we can swap the manual backend for a biometrics API later without changing the UI.

### What We'll Build

**1. Database Schema**
- `attendance_logs` table: Records clock-in/out with timestamps, employee_id, date, status (present/absent/late)
- `attendance_settings` table: Configure work hours, late threshold, auto-mark policies
- RLS policies: Employees see own logs, managers see team logs, HR admins see all

**2. Employee Features**
- Clock-in/clock-out button on dashboard (shows current status: "Clocked In", "Clocked Out", time elapsed)
- Quick action card: "Check In/Out" on the dashboard
- Daily attendance status badge (Present, Absent, Late)
- View personal attendance history page

**3. Manager Features**
- Team attendance calendar view (similar to leave calendar)
- Daily team status report (who's present/absent/late)
- Ability to mark employees as present/absent/late for exceptions

**4. HR Admin Features**
- Attendance dashboard with analytics
- Attendance reports (daily, monthly, by department)
- Cross-reference with approved leave (flag unapproved absences)
- Bulk attendance corrections

**5. Backend Framework**
- Edge function `sync-attendance` (polls biometrics API when ready)
- Database function `auto_mark_attendance()` for daily absent status
- Webhook endpoint stub (ready for biometrics vendor webhooks)

### Architecture
```
Employee Clock In/Out
        ↓
attendance_logs table
        ↓
Managers/HR View Dashboard & Analytics
        ↓
(Later) Biometrics API → sync-attendance function → attendance_logs
```

### Implementation Steps
1. Create `attendance_logs` and `attendance_settings` tables with RLS policies
2. Add "Check In/Out" quick action button to dashboard
3. Create attendance history page
4. Build manager attendance calendar & daily status view
5. Build HR admin attendance dashboard with analytics
6. Set up edge function scaffold for future biometrics integration
7. Create daily job to auto-mark absent employees

### Why This Approach
- ✅ Works immediately without biometrics vendor
- ✅ Employees can manually track attendance
- ✅ Managers get visibility into team status
- ✅ Ready to plug in biometrics API later without UI changes
- ✅ Data structure supports both manual + vendor APIs

### Integration Point for Biometrics (Future)
Once you get vendor details:
1. Add API credentials as secrets
2. Update `sync-attendance` edge function to call vendor API
3. Function automatically syncs attendance logs
4. All UI remains the same

