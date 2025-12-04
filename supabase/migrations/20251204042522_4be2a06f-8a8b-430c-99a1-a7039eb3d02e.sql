-- Create enums for roles and status types
CREATE TYPE public.staff_role AS ENUM ('admin', 'branch_manager', 'trainer', 'accounts', 'reception');
CREATE TYPE public.enrollment_status AS ENUM ('active', 'completed', 'dropped', 'transferred');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE public.payment_mode AS ENUM ('cash', 'card', 'upi', 'bank_transfer', 'cheque');
CREATE TYPE public.receipt_status AS ENUM ('valid', 'voided', 'refunded');
CREATE TYPE public.certificate_status AS ENUM ('issued', 'revoked');

-- Branches table
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Staff profiles table (linked to auth.users)
CREATE TABLE public.staff_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  employee_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  designation TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role staff_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  admission_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  alternate_phone TEXT,
  address TEXT,
  date_of_birth DATE,
  gender TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  qualification TEXT,
  photo_url TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  duration_hours INTEGER NOT NULL DEFAULT 0,
  duration_days INTEGER NOT NULL DEFAULT 0,
  fee_amount DECIMAL(10,2) DEFAULT 0,
  syllabus TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Batches table
CREATE TABLE public.batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  trainer_id UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE,
  schedule TEXT,
  timings TEXT,
  capacity INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enrollments table
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE NOT NULL,
  enrolled_by UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status enrollment_status NOT NULL DEFAULT 'active',
  fee_paid DECIMAL(10,2) DEFAULT 0,
  fee_pending DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (student_id, batch_id)
);

-- Attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE NOT NULL,
  session_date DATE NOT NULL,
  session_number INTEGER DEFAULT 1,
  status attendance_status NOT NULL DEFAULT 'present',
  marked_by UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, session_date, session_number)
);

-- Receipts table
CREATE TABLE public.receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL NOT NULL,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  receipt_number TEXT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  payment_mode payment_mode NOT NULL DEFAULT 'cash',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  remarks TEXT,
  status receipt_status NOT NULL DEFAULT 'valid',
  void_reason TEXT,
  generated_by UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Certificates table
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL NOT NULL,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  certificate_number TEXT NOT NULL UNIQUE,
  course_name TEXT NOT NULL,
  batch_name TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completion_date DATE,
  grade TEXT,
  attendance_percentage DECIMAL(5,2),
  status certificate_status NOT NULL DEFAULT 'issued',
  revoke_reason TEXT,
  issued_by UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  template_id TEXT DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Settings table for system configuration
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (branch_id, setting_key)
);

-- Enable RLS on all tables
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role staff_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's branch_id
CREATE OR REPLACE FUNCTION public.get_user_branch_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id FROM public.staff_profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- RLS Policies for branches
CREATE POLICY "Staff can view all branches" ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage branches" ON public.branches FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- RLS Policies for staff_profiles
CREATE POLICY "Staff can view all profiles" ON public.staff_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage staff profiles" ON public.staff_profiles FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Staff can view roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- RLS Policies for students (branch-scoped for non-admins)
CREATE POLICY "Staff can view students" ON public.students FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid()) OR branch_id = public.get_user_branch_id(auth.uid()) OR branch_id IS NULL
);
CREATE POLICY "Staff can manage students" ON public.students FOR ALL TO authenticated USING (
  public.is_admin(auth.uid()) OR branch_id = public.get_user_branch_id(auth.uid()) OR branch_id IS NULL
);

-- RLS Policies for courses
CREATE POLICY "Staff can view courses" ON public.courses FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid()) OR branch_id = public.get_user_branch_id(auth.uid()) OR branch_id IS NULL
);
CREATE POLICY "Staff can manage courses" ON public.courses FOR ALL TO authenticated USING (
  public.is_admin(auth.uid()) OR branch_id = public.get_user_branch_id(auth.uid()) OR branch_id IS NULL
);

-- RLS Policies for batches
CREATE POLICY "Staff can view batches" ON public.batches FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid()) OR branch_id = public.get_user_branch_id(auth.uid()) OR branch_id IS NULL
);
CREATE POLICY "Staff can manage batches" ON public.batches FOR ALL TO authenticated USING (
  public.is_admin(auth.uid()) OR branch_id = public.get_user_branch_id(auth.uid()) OR branch_id IS NULL
);

-- RLS Policies for enrollments
CREATE POLICY "Staff can view enrollments" ON public.enrollments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage enrollments" ON public.enrollments FOR ALL TO authenticated USING (true);

-- RLS Policies for attendance
CREATE POLICY "Staff can view attendance" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage attendance" ON public.attendance FOR ALL TO authenticated USING (true);

-- RLS Policies for receipts
CREATE POLICY "Staff can view receipts" ON public.receipts FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid()) OR branch_id = public.get_user_branch_id(auth.uid()) OR branch_id IS NULL
);
CREATE POLICY "Staff can manage receipts" ON public.receipts FOR ALL TO authenticated USING (
  public.is_admin(auth.uid()) OR branch_id = public.get_user_branch_id(auth.uid()) OR branch_id IS NULL
);

-- RLS Policies for certificates
CREATE POLICY "Staff can view certificates" ON public.certificates FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid()) OR branch_id = public.get_user_branch_id(auth.uid()) OR branch_id IS NULL
);
CREATE POLICY "Staff can manage certificates" ON public.certificates FOR ALL TO authenticated USING (
  public.is_admin(auth.uid()) OR branch_id = public.get_user_branch_id(auth.uid()) OR branch_id IS NULL
);

-- RLS Policies for settings
CREATE POLICY "Staff can view settings" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_staff_profiles_updated_at BEFORE UPDATE ON public.staff_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON public.batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON public.receipts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create staff profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_staff_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.staff_profiles (user_id, employee_id, full_name, email)
  VALUES (
    NEW.id,
    'EMP-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0'),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger for auto-creating staff profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_staff_user();

-- Sequences for receipt and certificate numbering
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS certificate_number_seq START 1;

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'RCP-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('receipt_number_seq')::TEXT, 5, '0');
END;
$$;

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'CERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('certificate_number_seq')::TEXT, 5, '0');
END;
$$;