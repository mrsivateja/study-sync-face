-- Fix attendance RLS policy to properly restrict access to student's own records
DROP POLICY IF EXISTS "Students can view their own attendance" ON attendance;

CREATE POLICY "Students can view their own attendance"
ON attendance FOR SELECT
USING (
  (student_id IN (
    SELECT id FROM students 
    WHERE user_id = auth.uid()
  )) 
  OR is_admin(auth.uid())
);