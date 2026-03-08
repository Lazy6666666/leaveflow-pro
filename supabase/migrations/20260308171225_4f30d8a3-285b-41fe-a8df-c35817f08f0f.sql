
-- Fix 1: Replace employee leave update policy to only allow cancellation
DROP POLICY "Employees can update own pending requests" ON public.leave_requests;
CREATE POLICY "Employees can cancel own pending requests"
  ON public.leave_requests FOR UPDATE TO authenticated
  USING (employee_id = auth.uid() AND status = 'pending')
  WITH CHECK (employee_id = auth.uid() AND status = 'cancelled');

-- Fix 2: Prevent non-HR users from changing manager_id or department_id
CREATE OR REPLACE FUNCTION public.prevent_protected_profile_fields()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'hr_admin') THEN
    IF NEW.manager_id IS DISTINCT FROM OLD.manager_id OR
       NEW.department_id IS DISTINCT FROM OLD.department_id THEN
      RAISE EXCEPTION 'Only HR admins can change manager or department assignments';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_protected_profile_fields();

-- Fix 3: Make avatars bucket private
UPDATE storage.buckets SET public = false WHERE id = 'avatars';
