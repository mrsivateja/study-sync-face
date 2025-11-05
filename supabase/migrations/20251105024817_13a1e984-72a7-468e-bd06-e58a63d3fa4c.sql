-- Add user_id column to students table to link user accounts with student records
ALTER TABLE public.students
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_students_user_id ON public.students(user_id);

-- Add RLS policy for students to view their own student record
CREATE POLICY "Students can view their own record"
ON public.students
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));