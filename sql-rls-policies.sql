-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_challenge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Prevent policy recursion by checking the role with definer rights instead of
-- querying profiles from inside another profiles policy.
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

-- =============================================
-- PROFILES RLS POLICIES
-- =============================================

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = auth_user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = auth_user_id);

-- Allows an authenticated user to create their profile if the Auth trigger was
-- added after the account was created.
CREATE POLICY "Users can create own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = auth_user_id);

-- Allow admins to read all profiles
CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT
USING (public.is_admin());

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (public.is_admin());

-- =============================================
-- EVENTS RLS POLICIES
-- =============================================

-- Allow everyone to read events
CREATE POLICY "Everyone can read events"
ON events FOR SELECT
USING (true);

-- Allow admins to insert events
CREATE POLICY "Admins can insert events"
ON events FOR INSERT
WITH CHECK (public.is_admin());

-- Allow admins to update events
CREATE POLICY "Admins can update events"
ON events FOR UPDATE
USING (public.is_admin());

-- Allow admins to delete events
CREATE POLICY "Admins can delete events"
ON events FOR DELETE
USING (public.is_admin());

-- =============================================
-- VOLUNTEER REGISTRATIONS RLS POLICIES
-- =============================================

-- Allow users to read their own registrations
CREATE POLICY "Users can read own registrations"
ON volunteer_registrations FOR SELECT
USING (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Allow users to insert their own registrations
CREATE POLICY "Users can insert own registrations"
ON volunteer_registrations FOR INSERT
WITH CHECK (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Allow users to update their own registrations
CREATE POLICY "Users can update own registrations"
ON volunteer_registrations FOR UPDATE
USING (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Allow admins to read all registrations
CREATE POLICY "Admins can read all registrations"
ON volunteer_registrations FOR SELECT
USING (public.is_admin());

-- =============================================
-- DONATIONS RLS POLICIES
-- =============================================

-- Allow users to read their own donations
CREATE POLICY "Users can read own donations"
ON donations FOR SELECT
USING (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Allow users to insert their own donations
CREATE POLICY "Users can insert own donations"
ON donations FOR INSERT
WITH CHECK (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Allow admins to read all donations
CREATE POLICY "Admins can read all donations"
ON donations FOR SELECT
USING (public.is_admin());

-- =============================================
-- GREEN CHALLENGE ENTRIES RLS POLICIES
-- =============================================

-- Allow users to read their own challenge entry
CREATE POLICY "Users can read own challenge entry"
ON green_challenge_entries FOR SELECT
USING (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Allow users to insert their own challenge entry
CREATE POLICY "Users can insert own challenge entry"
ON green_challenge_entries FOR INSERT
WITH CHECK (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Allow users to update their own challenge entry
CREATE POLICY "Users can update own challenge entry"
ON green_challenge_entries FOR UPDATE
USING (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Allow admins to read all challenge entries
CREATE POLICY "Admins can read all challenge entries"
ON green_challenge_entries FOR SELECT
USING (public.is_admin());

-- Allow admins to update challenge entries
CREATE POLICY "Admins can update challenge entries"
ON green_challenge_entries FOR UPDATE
USING (public.is_admin());

-- =============================================
-- NEWS RLS POLICIES
-- =============================================

-- Allow everyone to read news
CREATE POLICY "Everyone can read news"
ON news FOR SELECT
USING (true);

-- Allow admins to insert news
CREATE POLICY "Admins can insert news"
ON news FOR INSERT
WITH CHECK (public.is_admin());

-- Allow admins to update news
CREATE POLICY "Admins can update news"
ON news FOR UPDATE
USING (public.is_admin());

-- Allow admins to delete news
CREATE POLICY "Admins can delete news"
ON news FOR DELETE
USING (public.is_admin());
