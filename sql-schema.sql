-- =============================================
-- GREEN TOMORROW INITIATIVE - SUPABASE SCHEMA
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on auth_user_id for faster lookups
CREATE INDEX idx_profiles_auth_user_id ON profiles(auth_user_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Creates the member profile securely for every Auth sign-up. This also works
-- when Supabase email confirmation is enabled and no browser session exists yet.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
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

-- =============================================
-- EVENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  available_spots INTEGER NOT NULL CHECK (available_spots >= 0),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_date ON events(date);

-- =============================================
-- VOLUNTEER REGISTRATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS volunteer_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'joined' CHECK (status IN ('joined', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create indexes
CREATE INDEX idx_volunteer_registrations_event_id ON volunteer_registrations(event_id);
CREATE INDEX idx_volunteer_registrations_user_id ON volunteer_registrations(user_id);

-- =============================================
-- DONATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  payment_reference TEXT UNIQUE,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_donations_user_id ON donations(user_id);
CREATE INDEX idx_donations_status ON donations(status);

-- =============================================
-- GREEN CHALLENGE ENTRIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS green_challenge_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  university TEXT NOT NULL,
  project_title TEXT NOT NULL,
  project_summary TEXT NOT NULL,
  team_lead_name TEXT NOT NULL,
  team_lead_email TEXT NOT NULL,
  team_lead_student_number TEXT NOT NULL,
  team_members TEXT,
  team_size INTEGER NOT NULL CHECK (team_size >= 2 AND team_size <= 5),
  proposal_file_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX idx_challenge_entries_user_id ON green_challenge_entries(user_id);
CREATE INDEX idx_challenge_entries_status ON green_challenge_entries(status);

-- =============================================
-- NEWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_news_published_at ON news(published_at DESC);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenge_entries_updated_at BEFORE UPDATE ON green_challenge_entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
