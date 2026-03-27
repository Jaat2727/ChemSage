-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('auth', 'synergy_group', 'vault')),
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage notifications"
    ON public.notifications FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Function: Notify profile approval
CREATE OR REPLACE FUNCTION public.notify_profile_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.status = 'active' AND OLD.status = 'pending' THEN
        INSERT INTO public.notifications (user_id, type, message)
        VALUES (NEW.id, 'auth', 'Your account has been approved by an administrator. Welcome to ChemSAGE!');
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger: Profile approval
CREATE TRIGGER on_profile_approved
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_profile_approval();


-- Function: Notify new synergy group message
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r_name TEXT;
    s_name TEXT;
BEGIN
    IF NEW.room_id != 'global' THEN
        -- Get room name
        SELECT name INTO r_name FROM public.rooms WHERE id = NEW.room_id;
        -- Get sender name
        SELECT name INTO s_name FROM public.profiles WHERE id = NEW.sender_id;

        -- Insert notification for all members except sender
        INSERT INTO public.notifications (user_id, type, message)
        SELECT user_id, 'synergy_group', s_name || ' sent a message in ' || r_name
        FROM public.room_members
        WHERE room_id = NEW.room_id AND user_id != NEW.sender_id;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger: New message
CREATE TRIGGER on_new_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_new_message();


-- Function: Notify new resource upload
CREATE OR REPLACE FUNCTION public.notify_new_resource()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If room_id is specified, notify only room members
    IF NEW.room_id IS NOT NULL AND NEW.room_id != 'global' THEN
        INSERT INTO public.notifications (user_id, type, message)
        SELECT user_id, 'vault', 'New resource uploaded in your group: ' || NEW.title
        FROM public.room_members
        WHERE room_id = NEW.room_id AND user_id != NEW.uploaded_by;
    ELSE
        -- Notify all active users for global resources
        INSERT INTO public.notifications (user_id, type, message)
        SELECT id, 'vault', 'New resource added to the Study Vault: ' || NEW.title
        FROM public.profiles
        WHERE status = 'active' AND id != NEW.uploaded_by;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger: New resource
CREATE TRIGGER on_new_resource
    AFTER INSERT ON public.resources
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_new_resource();
