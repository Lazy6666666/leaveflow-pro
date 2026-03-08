
-- Public holidays table
CREATE TABLE public.public_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date NOT NULL,
  description text,
  is_recurring boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.public_holidays ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view holidays
CREATE POLICY "Anyone authenticated can view holidays"
  ON public.public_holidays FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "HR admins can insert holidays"
  ON public.public_holidays FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'hr_admin'));

CREATE POLICY "HR admins can update holidays"
  ON public.public_holidays FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'));

CREATE POLICY "HR admins can delete holidays"
  ON public.public_holidays FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'));

-- Create avatar storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');
