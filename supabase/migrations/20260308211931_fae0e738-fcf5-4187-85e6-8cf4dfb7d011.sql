
-- Create biometrics vendor enum
CREATE TYPE public.biometrics_vendor AS ENUM ('zkteco', 'biotime', 'suprema', 'hikvision', 'generic_webhook');

-- Create biometrics_config table
CREATE TABLE public.biometrics_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor public.biometrics_vendor NOT NULL,
  name TEXT NOT NULL,
  api_url TEXT,
  api_key TEXT,
  api_secret TEXT,
  device_serial TEXT,
  location_name TEXT,
  sync_frequency_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_sync_status TEXT,
  last_sync_records INTEGER DEFAULT 0,
  webhook_secret TEXT,
  extra_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.biometrics_config ENABLE ROW LEVEL SECURITY;

-- Only HR admins can manage biometrics config
CREATE POLICY "HR admins can view biometrics config"
  ON public.biometrics_config FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'::app_role));

CREATE POLICY "HR admins can insert biometrics config"
  ON public.biometrics_config FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'hr_admin'::app_role));

CREATE POLICY "HR admins can update biometrics config"
  ON public.biometrics_config FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'::app_role));

CREATE POLICY "HR admins can delete biometrics config"
  ON public.biometrics_config FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_biometrics_config_updated_at
  BEFORE UPDATE ON public.biometrics_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
