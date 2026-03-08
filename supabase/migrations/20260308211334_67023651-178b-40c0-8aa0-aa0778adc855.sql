
-- Create attendance status enum
CREATE TYPE public.attendance_status AS ENUM ('present', 'late', 'absent', 'half_day', 'on_leave');

-- Create attendance_logs table
CREATE TABLE public.attendance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIMESTAMP WITH TIME ZONE,
  clock_out TIMESTAMP WITH TIME ZONE,
  status attendance_status NOT NULL DEFAULT 'present',
  source TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Create attendance_settings table
CREATE TABLE public.attendance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_start_time TIME NOT NULL DEFAULT '09:00:00',
  work_end_time TIME NOT NULL DEFAULT '17:00:00',
  late_threshold_minutes INTEGER NOT NULL DEFAULT 15,
  half_day_hours NUMERIC NOT NULL DEFAULT 4,
  auto_mark_absent BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_settings ENABLE ROW LEVEL SECURITY;

-- RLS for attendance_logs
CREATE POLICY "Employees can view own attendance" ON public.attendance_logs
  FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Employees can insert own attendance" ON public.attendance_logs
  FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees can update own attendance today" ON public.attendance_logs
  FOR UPDATE USING (employee_id = auth.uid() AND date = CURRENT_DATE);

CREATE POLICY "Managers can view team attendance" ON public.attendance_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = attendance_logs.employee_id
      AND profiles.manager_id = auth.uid()
    )
  );

CREATE POLICY "Managers can update team attendance" ON public.attendance_logs
  FOR UPDATE USING (
    has_role(auth.uid(), 'manager') AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = attendance_logs.employee_id
      AND profiles.manager_id = auth.uid()
    )
  );

CREATE POLICY "HR admins can view all attendance" ON public.attendance_logs
  FOR SELECT USING (has_role(auth.uid(), 'hr_admin'));

CREATE POLICY "HR admins can insert all attendance" ON public.attendance_logs
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'hr_admin'));

CREATE POLICY "HR admins can update all attendance" ON public.attendance_logs
  FOR UPDATE USING (has_role(auth.uid(), 'hr_admin'));

CREATE POLICY "HR admins can delete attendance" ON public.attendance_logs
  FOR DELETE USING (has_role(auth.uid(), 'hr_admin'));

-- RLS for attendance_settings
CREATE POLICY "Anyone authenticated can view settings" ON public.attendance_settings
  FOR SELECT USING (true);

CREATE POLICY "HR admins can insert settings" ON public.attendance_settings
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'hr_admin'));

CREATE POLICY "HR admins can update settings" ON public.attendance_settings
  FOR UPDATE USING (has_role(auth.uid(), 'hr_admin'));

CREATE POLICY "HR admins can delete settings" ON public.attendance_settings
  FOR DELETE USING (has_role(auth.uid(), 'hr_admin'));

-- Add updated_at trigger
CREATE TRIGGER update_attendance_logs_updated_at
  BEFORE UPDATE ON public.attendance_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_settings_updated_at
  BEFORE UPDATE ON public.attendance_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO public.attendance_settings (work_start_time, work_end_time, late_threshold_minutes)
VALUES ('09:00:00', '17:00:00', 15);

-- Enable realtime for attendance_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_logs;
