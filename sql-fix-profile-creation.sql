-- Run once in the Supabase SQL Editor.
-- It repairs existing users and guarantees that future Auth sign-ups receive a
-- matching public profile without relying on browser-side permissions.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (auth_user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'member'
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for accounts created before the trigger was installed.
INSERT INTO public.profiles (auth_user_id, full_name, email, role)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  u.email,
  'member'
FROM auth.users AS u
ON CONFLICT (auth_user_id) DO NOTHING;

-- Keep the fallback used by the site available for authenticated members.
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
CREATE POLICY "Users can create own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_user_id);
