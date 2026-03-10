-- Add selfie columns to attendance_logs
ALTER TABLE public.attendance_logs
ADD COLUMN selfie_clock_in TEXT,
ADD COLUMN selfie_clock_out TEXT;

-- Add require_selfie setting to attendance_settings
ALTER TABLE public.attendance_settings
ADD COLUMN require_selfie BOOLEAN NOT NULL DEFAULT false;

-- Create storage bucket for attendance selfies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attendance-selfies', 'attendance-selfies', false);

-- Set up RLS for the new bucket
-- Employees upload own selfies
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
  USING (bucket_id = 'attendance-selfies' AND public.has_role(auth.uid(), 'hr_admin'));
