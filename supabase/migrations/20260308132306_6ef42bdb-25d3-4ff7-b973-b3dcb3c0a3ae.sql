
-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('employee', 'manager', 'hr_admin');

-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  department_id UUID REFERENCES public.departments(id),
  manager_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create leave_types table
CREATE TABLE public.leave_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  annual_allocation INT NOT NULL DEFAULT 0,
  carry_forward_limit INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leave_balances table
CREATE TABLE public.leave_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  year INT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  UNIQUE (employee_id, leave_type_id, year)
);

-- Create leave_requests table
CREATE TABLE public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  manager_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for leave_requests updated_at
CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile and assign default employee role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'employee');
  RETURN NEW;
END;
$$;

-- Trigger on auth.users for new signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- DEPARTMENTS policies
CREATE POLICY "Anyone authenticated can view departments"
  ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "HR admins can insert departments"
  ON public.departments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "HR admins can update departments"
  ON public.departments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "HR admins can delete departments"
  ON public.departments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'));

-- PROFILES policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());
CREATE POLICY "Managers can view team profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (manager_id = auth.uid());
CREATE POLICY "HR admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());
CREATE POLICY "HR admins can insert profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "HR admins can update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "HR admins can delete profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'));

-- USER_ROLES policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "HR admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "HR admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "HR admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "HR admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'));

-- LEAVE_TYPES policies
CREATE POLICY "Anyone authenticated can view leave types"
  ON public.leave_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "HR admins can insert leave types"
  ON public.leave_types FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "HR admins can update leave types"
  ON public.leave_types FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "HR admins can delete leave types"
  ON public.leave_types FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'));

-- LEAVE_BALANCES policies
CREATE POLICY "Employees can view own balances"
  ON public.leave_balances FOR SELECT TO authenticated
  USING (employee_id = auth.uid());
CREATE POLICY "Managers can view team balances"
  ON public.leave_balances FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = leave_balances.employee_id
      AND profiles.manager_id = auth.uid()
    )
  );
CREATE POLICY "HR admins can view all balances"
  ON public.leave_balances FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "HR admins can insert balances"
  ON public.leave_balances FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "HR admins can update balances"
  ON public.leave_balances FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "HR admins can delete balances"
  ON public.leave_balances FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'));

-- LEAVE_REQUESTS policies
CREATE POLICY "Employees can view own requests"
  ON public.leave_requests FOR SELECT TO authenticated
  USING (employee_id = auth.uid());
CREATE POLICY "Employees can create own requests"
  ON public.leave_requests FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid());
CREATE POLICY "Employees can update own pending requests"
  ON public.leave_requests FOR UPDATE TO authenticated
  USING (employee_id = auth.uid() AND status = 'pending');
CREATE POLICY "Managers can view team requests"
  ON public.leave_requests FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = leave_requests.employee_id
      AND profiles.manager_id = auth.uid()
    )
  );
CREATE POLICY "Managers can update team requests"
  ON public.leave_requests FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'manager') AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = leave_requests.employee_id
      AND profiles.manager_id = auth.uid()
    )
  );
CREATE POLICY "HR admins can view all requests"
  ON public.leave_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "HR admins can insert requests"
  ON public.leave_requests FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "HR admins can update all requests"
  ON public.leave_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "HR admins can delete requests"
  ON public.leave_requests FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'));

-- Seed default leave types
INSERT INTO public.leave_types (name, annual_allocation, carry_forward_limit) VALUES
  ('Annual Leave', 20, 5),
  ('Sick Leave', 12, 0),
  ('Emergency Leave', 3, 0),
  ('Unpaid Leave', 0, 0);

-- Storage bucket for leave attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('leave-attachments', 'leave-attachments', false);

-- Storage policies
CREATE POLICY "Users can upload own attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'leave-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'leave-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Managers can view team attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'leave-attachments' AND public.has_role(auth.uid(), 'manager'));
CREATE POLICY "HR admins can view all attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'leave-attachments' AND public.has_role(auth.uid(), 'hr_admin'));
