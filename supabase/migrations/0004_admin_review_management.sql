-- Migration: Add admin review management capabilities
-- Allow admins to update and delete any review for moderation purposes

-- Update RLS policies for program_reviews to allow admin access
DROP POLICY IF EXISTS "Users can update their own reviews." ON program_reviews;
CREATE POLICY "Users can update their own reviews or admins can update any." 
ON program_reviews FOR UPDATE WITH CHECK (
  auth.uid() = user_id OR 
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete their own reviews." ON program_reviews;
CREATE POLICY "Users can delete their own reviews or admins can delete any." 
ON program_reviews FOR DELETE USING (
  auth.uid() = user_id OR 
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);

-- Update RLS policies for school_reviews to allow admin access
DROP POLICY IF EXISTS "Users can update their own reviews." ON school_reviews;
CREATE POLICY "Users can update their own reviews or admins can update any." 
ON school_reviews FOR UPDATE WITH CHECK (
  auth.uid() = user_id OR 
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete their own reviews." ON school_reviews;
CREATE POLICY "Users can delete their own reviews or admins can delete any." 
ON school_reviews FOR DELETE USING (
  auth.uid() = user_id OR 
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);

-- Add comments to document the admin access
COMMENT ON POLICY "Users can update their own reviews or admins can update any." ON program_reviews 
IS 'Users can update their own reviews, admins can update any review for moderation';

COMMENT ON POLICY "Users can delete their own reviews or admins can delete any." ON program_reviews 
IS 'Users can delete their own reviews, admins can delete any review for moderation';

COMMENT ON POLICY "Users can update their own reviews or admins can update any." ON school_reviews 
IS 'Users can update their own reviews, admins can update any review for moderation';

COMMENT ON POLICY "Users can delete their own reviews or admins can delete any." ON school_reviews 
IS 'Users can delete their own reviews, admins can delete any review for moderation';
