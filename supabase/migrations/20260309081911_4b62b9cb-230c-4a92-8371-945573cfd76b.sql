
-- Fix audit_logs INSERT policy: change from public to authenticated
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Fix attendance_settings SELECT policy
DROP POLICY IF EXISTS "Anyone authenticated can view settings" ON public.attendance_settings;
CREATE POLICY "Anyone authenticated can view settings" ON public.attendance_settings
  FOR SELECT TO authenticated
  USING (true);

-- Fix departments SELECT policy
DROP POLICY IF EXISTS "Anyone authenticated can view departments" ON public.departments;
CREATE POLICY "Anyone authenticated can view departments" ON public.departments
  FOR SELECT TO authenticated
  USING (true);

-- Fix leave_types SELECT policy
DROP POLICY IF EXISTS "Anyone authenticated can view leave types" ON public.leave_types;
CREATE POLICY "Anyone authenticated can view leave types" ON public.leave_types
  FOR SELECT TO authenticated
  USING (true);

-- Fix public_holidays SELECT policy
DROP POLICY IF EXISTS "Anyone authenticated can view holidays" ON public.public_holidays;
CREATE POLICY "Anyone authenticated can view holidays" ON public.public_holidays
  FOR SELECT TO authenticated
  USING (true);
