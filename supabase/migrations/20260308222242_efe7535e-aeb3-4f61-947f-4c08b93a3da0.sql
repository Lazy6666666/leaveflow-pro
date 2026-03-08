
-- Fix permissive INSERT policy - restrict to system triggers (service role) and self-inserts
DROP POLICY "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
