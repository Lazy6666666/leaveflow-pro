
-- 1. Auto-deduct leave balance on approval, restore on cancellation/rejection after approval
CREATE OR REPLACE FUNCTION public.handle_leave_balance_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  day_count numeric;
BEGIN
  day_count := (NEW.end_date - NEW.start_date) + 1;

  -- Deduct on approval
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE leave_balances
    SET balance = balance - day_count
    WHERE employee_id = NEW.employee_id
      AND leave_type_id = NEW.leave_type_id
      AND year = EXTRACT(YEAR FROM NEW.start_date)::int;
  END IF;

  -- Restore on cancellation/rejection of previously approved request
  IF OLD.status = 'approved' AND NEW.status IN ('cancelled', 'rejected') THEN
    UPDATE leave_balances
    SET balance = balance + day_count
    WHERE employee_id = NEW.employee_id
      AND leave_type_id = NEW.leave_type_id
      AND year = EXTRACT(YEAR FROM NEW.start_date)::int;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_leave_balance_change
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_leave_balance_change();

-- 2. Auto-provision leave balances on new user signup
CREATE OR REPLACE FUNCTION public.provision_leave_balances()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO leave_balances (employee_id, leave_type_id, balance, year)
  SELECT NEW.id, lt.id, lt.annual_allocation, EXTRACT(YEAR FROM now())::int
  FROM leave_types lt
  WHERE lt.is_active = true;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_provision_leave_balances
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.provision_leave_balances();

-- 3. Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 4. Trigger to create notification on leave status change
CREATE OR REPLACE FUNCTION public.notify_leave_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  leave_type_name TEXT;
  emp_name TEXT;
  manager_uid UUID;
BEGIN
  SELECT name INTO leave_type_name FROM leave_types WHERE id = NEW.leave_type_id;
  SELECT full_name INTO emp_name FROM profiles WHERE id = NEW.employee_id;
  SELECT manager_id INTO manager_uid FROM profiles WHERE id = NEW.employee_id;

  -- Notify employee on approval/rejection
  IF NEW.status IN ('approved', 'rejected') AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.employee_id,
      'Leave ' || initcap(NEW.status),
      'Your ' || leave_type_name || ' request has been ' || NEW.status || '.',
      CASE WHEN NEW.status = 'approved' THEN 'success' ELSE 'error' END
    );
  END IF;

  -- Notify manager on new submission
  IF NEW.status = 'pending' AND OLD.status IS DISTINCT FROM 'pending' AND manager_uid IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      manager_uid,
      'New Leave Request',
      COALESCE(emp_name, 'An employee') || ' submitted a ' || leave_type_name || ' request.',
      'info'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_leave_status
  AFTER UPDATE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_leave_status_change();

-- Also notify on insert (new request → manager)
CREATE OR REPLACE FUNCTION public.notify_new_leave_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  leave_type_name TEXT;
  emp_name TEXT;
  manager_uid UUID;
BEGIN
  SELECT name INTO leave_type_name FROM leave_types WHERE id = NEW.leave_type_id;
  SELECT full_name, manager_id INTO emp_name, manager_uid FROM profiles WHERE id = NEW.employee_id;

  IF manager_uid IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      manager_uid,
      'New Leave Request',
      COALESCE(emp_name, 'An employee') || ' submitted a ' || leave_type_name || ' request.',
      'info'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_leave
  AFTER INSERT ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_leave_request();
