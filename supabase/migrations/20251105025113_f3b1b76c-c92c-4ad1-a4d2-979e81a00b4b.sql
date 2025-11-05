-- Create function to automatically make first user an admin
CREATE OR REPLACE FUNCTION public.handle_first_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the first user and no admin exists
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to run after user creation
CREATE TRIGGER on_auth_user_created_first_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_first_admin();

-- Create function to link student accounts on signup
CREATE OR REPLACE FUNCTION public.link_student_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_record RECORD;
BEGIN
  -- Try to find student by email
  SELECT * INTO student_record
  FROM public.students
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
  LIMIT 1;
  
  -- If student found, link the user_id
  IF FOUND THEN
    UPDATE public.students
    SET user_id = NEW.id
    WHERE id = student_record.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to link students
CREATE TRIGGER on_auth_user_created_link_student
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_student_on_signup();

-- Add email column to students table
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS email text;

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(LOWER(TRIM(email)));