-- Run once if sql-event-participants.sql was previously executed.
-- Removes public access to attendee names and provides a public count only.

REVOKE EXECUTE ON FUNCTION public.get_event_participants(UUID) FROM PUBLIC, anon, authenticated;

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
