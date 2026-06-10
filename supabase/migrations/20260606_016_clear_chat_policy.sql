-- Allow users to delete all messages in a DM room they are part of
-- This enables the "Clear Chat for both sides" feature similar to Telegram

CREATE POLICY "messages delete dm both sides" ON messages 
FOR DELETE TO authenticated 
USING (
  is_active_user() AND 
  room_id LIKE '%' || auth.uid() || '%'
);

-- Allow users to delete the actual DM room they are part of
-- This cascades and completely removes the chat from the sidebar for both users
CREATE POLICY "rooms delete dm both sides" ON rooms 
FOR DELETE TO authenticated 
USING (
  is_active_user() AND 
  id LIKE '%' || auth.uid() || '%'
);
