
-- Badge ID mapping table for biometrics integration
CREATE TABLE public.badge_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  vendor TEXT, -- optional: restrict mapping to a specific vendor
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(badge_id, vendor)
);

ALTER TABLE public.badge_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR admins can view badge mappings" ON public.badge_mappings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'hr_admin'));

CREATE POLICY "HR admins can insert badge mappings" ON public.badge_mappings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'hr_admin'));

CREATE POLICY "HR admins can update badge mappings" ON public.badge_mappings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'hr_admin'));

CREATE POLICY "HR admins can delete badge mappings" ON public.badge_mappings
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'hr_admin'));
