-- ═══════════════════════════════════════════════════════════════════════════
-- ChemSAGE Storage Configuration Migration
-- Date: 2026-06-04
-- Purpose: Setup missing storage buckets and RLS policies
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('banners', 'banners', true) ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('resources', 'resources', true) ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('past_papers', 'past_papers', true) ON CONFLICT DO NOTHING;

-- 2. Avatars Policies
CREATE POLICY "Avatars are publicly accessible" 
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid() = owner
  );

CREATE POLICY "Users can update their own avatar" 
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid() = owner
  );

CREATE POLICY "Users can delete their own avatar" 
  ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars' AND auth.uid() = owner
  );

-- 3. Banners Policies
CREATE POLICY "Banners are publicly accessible" 
  ON storage.objects FOR SELECT USING (bucket_id = 'banners');

CREATE POLICY "Users can upload their own banner" 
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'banners' AND auth.uid() = owner
  );

CREATE POLICY "Users can update their own banner" 
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'banners' AND auth.uid() = owner
  );

CREATE POLICY "Users can delete their own banner" 
  ON storage.objects FOR DELETE USING (
    bucket_id = 'banners' AND auth.uid() = owner
  );

-- 4. Resources Policies
CREATE POLICY "Resources are publicly accessible" 
  ON storage.objects FOR SELECT USING (bucket_id = 'resources');

CREATE POLICY "Active users can upload resources" 
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'resources' AND public.is_active_user()
  );

CREATE POLICY "Owners or Admins can update resources" 
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'resources' AND (auth.uid() = owner OR public.is_admin())
  );

CREATE POLICY "Owners or Admins can delete resources" 
  ON storage.objects FOR DELETE USING (
    bucket_id = 'resources' AND (auth.uid() = owner OR public.is_admin())
  );

-- 5. Past Papers Policies
CREATE POLICY "Past Papers are publicly accessible" 
  ON storage.objects FOR SELECT USING (bucket_id = 'past_papers');

CREATE POLICY "Active users can upload past papers" 
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'past_papers' AND public.is_active_user()
  );

CREATE POLICY "Owners or Admins can update past papers" 
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'past_papers' AND (auth.uid() = owner OR public.is_admin())
  );

CREATE POLICY "Owners or Admins can delete past papers" 
  ON storage.objects FOR DELETE USING (
    bucket_id = 'past_papers' AND (auth.uid() = owner OR public.is_admin())
  );
