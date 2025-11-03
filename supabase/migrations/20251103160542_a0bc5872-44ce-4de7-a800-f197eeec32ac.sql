-- Add RLS policies for user_roles table to prevent privilege escalation
-- These policies ensure only admins can manage role assignments

-- Policy: Admins can insert new role assignments
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin(auth.uid())
);

-- Policy: Admins can delete role assignments (except their own to prevent lockout)
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.is_admin(auth.uid()) 
  AND user_id != auth.uid()
);

-- Policy: Admins can update role assignments (except their own)
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  public.is_admin(auth.uid())
  AND user_id != auth.uid()
)
WITH CHECK (
  public.is_admin(auth.uid())
  AND user_id != auth.uid()
);