-- Add index for better query performance on attendance lookups
CREATE INDEX IF NOT EXISTS idx_attendance_student_date_period ON public.attendance(student_id, date, period);

-- Add unique constraint to prevent duplicate attendance records for same student, date, and period
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_attendance_per_period'
  ) THEN
    ALTER TABLE public.attendance
    ADD CONSTRAINT unique_attendance_per_period UNIQUE (student_id, date, period);
  END IF;
END $$;