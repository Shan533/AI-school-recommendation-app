-- Update collections to support both schools and programs
-- Add description field to collections table
ALTER TABLE public.collections 
ADD COLUMN description text,
ADD COLUMN updated_at timestamptz DEFAULT now();

-- Create trigger to update updated_at on collections
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update collection_items to support both schools and programs
-- First, make school_id nullable and add program_id
ALTER TABLE public.collection_items 
ALTER COLUMN school_id DROP NOT NULL,
ADD COLUMN program_id uuid REFERENCES programs(id) ON DELETE CASCADE,
ADD COLUMN notes text,
ADD CONSTRAINT collection_items_content_check CHECK (
  (school_id IS NOT NULL AND program_id IS NULL) OR 
  (school_id IS NULL AND program_id IS NOT NULL)
);

-- Add unique constraint to prevent duplicate items
ALTER TABLE public.collection_items 
ADD CONSTRAINT unique_collection_school UNIQUE (collection_id, school_id),
ADD CONSTRAINT unique_collection_program UNIQUE (collection_id, program_id);

-- Update RLS policies for collection_items to handle programs
DROP POLICY "Users can insert their own collection items." ON collection_items;
DROP POLICY "Users can delete their own collection items." ON collection_items;

CREATE POLICY "Users can insert their own collection items." ON collection_items FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM collections WHERE id = collection_id)
);

CREATE POLICY "Users can update their own collection items." ON collection_items FOR UPDATE WITH CHECK (
  auth.uid() = (SELECT user_id FROM collections WHERE id = collection_id)
);

CREATE POLICY "Users can delete their own collection items." ON collection_items FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM collections WHERE id = collection_id)
);

-- Create indexes for better performance
CREATE INDEX idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX idx_collection_items_school_id ON collection_items(school_id) WHERE school_id IS NOT NULL;
CREATE INDEX idx_collection_items_program_id ON collection_items(program_id) WHERE program_id IS NOT NULL;
CREATE INDEX idx_collections_user_id ON collections(user_id);

-- Create a default collection for existing users
INSERT INTO public.collections (user_id, name, description)
SELECT id, 'My Favorites', 'My favorite schools and programs'
FROM auth.users 
WHERE id IN (SELECT id FROM public.profiles)
ON CONFLICT DO NOTHING;
