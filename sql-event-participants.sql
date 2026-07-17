-- Run once in Supabase SQL Editor. This exposes only a public attendee count;
-- attendee names are available exclusively in the admin dashboard.
CREATE OR REPLACE FUNCTION public.get_event_participant_count(target_event_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.volunteer_registrations AS registration
  WHERE registration.event_id = target_event_id
    AND registration.status = 'joined';
$$;

GRANT EXECUTE ON FUNCTION public.get_event_participant_count(UUID) TO anon, authenticated;
