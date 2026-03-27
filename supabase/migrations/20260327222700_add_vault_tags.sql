-- Add tags array to resources
ALTER TABLE public.resources ADD COLUMN tags TEXT[] DEFAULT '{}'::TEXT[];

-- Create a GIN index on tags for fast array overlap/contains searching
CREATE INDEX IF NOT EXISTS resources_tags_idx ON public.resources USING GIN (tags);

-- Create a GIN index for full text search on the title
-- We use the english dictionary for basic tokenization of course names/notes
CREATE INDEX IF NOT EXISTS resources_title_fts_idx ON public.resources USING GIN (to_tsvector('english', title));
