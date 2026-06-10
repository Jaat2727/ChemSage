-- Fix the RLS policy for inserting into room_members to allow users to add others to DMs they created

-- First, fix any existing broken DMs where the second user wasn't added because of the RLS policy
WITH dm_rooms AS (
  SELECT id FROM rooms WHERE is_public = false AND length(id) = 73
),
broken_dms AS (
  SELECT room_id FROM room_members 
  WHERE room_id IN (SELECT id FROM dm_rooms)
  GROUP BY room_id HAVING COUNT(*) < 2
),
existing_members AS (
  SELECT room_id, user_id FROM room_members WHERE room_id IN (SELECT room_id FROM broken_dms)
)
INSERT INTO room_members (room_id, user_id)
SELECT 
  room_id,
  CASE 
    WHEN substring(room_id, 1, 36) = existing_members.user_id::text THEN substring(room_id, 38, 36)::uuid
    ELSE substring(room_id, 1, 36)::uuid
  END as missing_user_id
FROM existing_members
ON CONFLICT DO NOTHING;

-- Now create a new policy that allows adding users to DM rooms
-- A user can insert a room_member if they are active, AND either:
-- 1. They created the room
-- 2. The room is a DM involving them (the room_id contains their UUID)
CREATE POLICY "room_members allow dm join" ON room_members 
FOR INSERT TO authenticated 
WITH CHECK (
  is_active_user() AND 
  (EXISTS (SELECT 1 FROM rooms WHERE id = room_id AND created_by = auth.uid()) OR room_id LIKE '%' || auth.uid() || '%')
);
