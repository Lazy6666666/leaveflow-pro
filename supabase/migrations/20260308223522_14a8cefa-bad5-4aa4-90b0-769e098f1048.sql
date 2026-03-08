
-- Manager delegation table
CREATE TABLE public.manager_delegations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delegate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT no_self_delegation CHECK (manager_id != delegate_id)
);

ALTER TABLE public.manager_delegations ENABLE ROW LEVEL SECURITY;

-- Managers can manage their own delegations
CREATE POLICY "Managers can view own delegations"
  ON public.manager_delegations FOR SELECT
  USING (manager_id = auth.uid() OR delegate_id = auth.uid());

CREATE POLICY "Managers can insert own delegations"
  ON public.manager_delegations FOR INSERT
  WITH CHECK (manager_id = auth.uid() AND has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers can update own delegations"
  ON public.manager_delegations FOR UPDATE
  USING (manager_id = auth.uid());

CREATE POLICY "HR admins can view all delegations"
  ON public.manager_delegations FOR SELECT
  USING (has_role(auth.uid(), 'hr_admin'::app_role));

CREATE POLICY "HR admins can manage all delegations"
  ON public.manager_delegations FOR ALL
  USING (has_role(auth.uid(), 'hr_admin'::app_role));

-- Update approvals: allow delegates to approve
CREATE POLICY "Delegates can update delegated team requests"
  ON public.leave_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM manager_delegations md
      JOIN profiles p ON p.manager_id = md.manager_id
      WHERE md.delegate_id = auth.uid()
        AND md.is_active = true
        AND CURRENT_DATE BETWEEN md.start_date AND md.end_date
        AND p.id = leave_requests.employee_id
    )
  );

CREATE POLICY "Delegates can view delegated team requests"
  ON public.leave_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM manager_delegations md
      JOIN profiles p ON p.manager_id = md.manager_id
      WHERE md.delegate_id = auth.uid()
        AND md.is_active = true
        AND CURRENT_DATE BETWEEN md.start_date AND md.end_date
        AND p.id = leave_requests.employee_id
    )
  );

-- Audit trigger for delegations
CREATE TRIGGER audit_manager_delegations
  AFTER INSERT OR UPDATE OR DELETE ON public.manager_delegations
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
