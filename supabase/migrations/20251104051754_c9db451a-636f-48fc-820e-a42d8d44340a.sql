-- Add period column to attendance table to track 7 different hours per day
ALTER TABLE public.attendance
ADD COLUMN period integer NOT NULL DEFAULT 1 CHECK (period >= 1 AND period <= 7);

-- Add index for better query performance
CREATE INDEX idx_attendance_student_date_period ON public.attendance(student_id, date, period);

-- Add RLS policy for students to view their own attendance
CREATE POLICY "Students can view their own attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM public.students WHERE id = student_id
  )
  OR public.is_admin(auth.uid())
);

-- Update unique constraint to allow multiple records per day (one per period)
-- First drop any existing unique constraint on date + student_id if it exists
-- Then create new unique constraint on date + student_id + period
ALTER TABLE public.attendance
ADD CONSTRAINT unique_attendance_per_period UNIQUE (student_id, date, period);