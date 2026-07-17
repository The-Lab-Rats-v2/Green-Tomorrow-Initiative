-- Run in the Supabase SQL Editor after at least one member profile exists.
-- Adds three upcoming Cape Town events without creating duplicates.

DO $$
DECLARE
  creator_id UUID;
BEGIN
  SELECT id INTO creator_id
  FROM public.profiles
  ORDER BY created_at
  LIMIT 1;

  IF creator_id IS NULL THEN
    RAISE EXCEPTION 'Create and confirm a member account before seeding events.';
  END IF;

  INSERT INTO public.events (title, description, location, date, available_spots, created_by)
  SELECT
    event_data.title,
    event_data.description,
    event_data.location,
    event_data.date,
    event_data.available_spots,
    creator_id
  FROM (
    VALUES
      (
        'Muizenberg Beach Clean-up',
        'Help remove litter from the shoreline, sort recyclable materials, and protect Cape Town''s coastal ecosystem.',
        'Surfers Corner, Muizenberg, Cape Town',
        '2026-08-15 09:00:00+02'::timestamptz,
        40
      ),
      (
        'Green Point Urban Tree Planting',
        'Join residents and local partners to plant indigenous trees and learn practical tree-care techniques.',
        'Green Point Urban Park, Cape Town',
        '2026-09-05 10:00:00+02'::timestamptz,
        30
      ),
      (
        'Sea Point Recycling Awareness Walk',
        'Walk the promenade with volunteers while sharing easy recycling and waste-reduction tips with the community.',
        'Sea Point Promenade, Cape Town',
        '2026-09-19 08:30:00+02'::timestamptz,
        25
      )
  ) AS event_data(title, description, location, date, available_spots)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.events AS existing_event
    WHERE existing_event.title = event_data.title
  );
END;
$$;
