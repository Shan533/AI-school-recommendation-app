-- Fix the incomplete UPDATE policy for collection_items table
-- The existing policy only has WITH CHECK but missing USING clause

-- Drop the existing incomplete policy
DROP POLICY IF EXISTS "Users can update their own collection items." ON collection_items;

-- Create the complete UPDATE policy with both USING and WITH CHECK
CREATE POLICY "Users can update their own collection items." ON collection_items FOR UPDATE 
USING (
  auth.uid() = (SELECT user_id FROM collections WHERE id = collection_id)
) 
WITH CHECK (
  auth.uid() = (SELECT user_id FROM collections WHERE id = collection_id)
);
