-- Run this once in the Supabase SQL Editor to repair policies already applied.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  );
$$;

ALTER POLICY "Admins can read all profiles" ON public.profiles USING (public.is_admin());
ALTER POLICY "Admins can update all profiles" ON public.profiles USING (public.is_admin());
ALTER POLICY "Admins can insert events" ON public.events WITH CHECK (public.is_admin());
ALTER POLICY "Admins can update events" ON public.events USING (public.is_admin());
ALTER POLICY "Admins can delete events" ON public.events USING (public.is_admin());
ALTER POLICY "Admins can read all registrations" ON public.volunteer_registrations USING (public.is_admin());
ALTER POLICY "Admins can read all donations" ON public.donations USING (public.is_admin());
ALTER POLICY "Admins can read all challenge entries" ON public.green_challenge_entries USING (public.is_admin());
ALTER POLICY "Admins can update challenge entries" ON public.green_challenge_entries USING (public.is_admin());
ALTER POLICY "Admins can insert news" ON public.news WITH CHECK (public.is_admin());
ALTER POLICY "Admins can update news" ON public.news USING (public.is_admin());
ALTER POLICY "Admins can delete news" ON public.news USING (public.is_admin());
