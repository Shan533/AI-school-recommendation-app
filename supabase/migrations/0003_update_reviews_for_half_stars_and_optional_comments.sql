-- Update program_reviews table to allow optional comments and decimal ratings
ALTER TABLE public.program_reviews 
  ALTER COLUMN comment DROP NOT NULL,
  ALTER COLUMN rating TYPE DECIMAL(2,1),
  DROP CONSTRAINT IF EXISTS program_reviews_rating_check,
  ADD CONSTRAINT program_reviews_rating_check CHECK (rating >= 0.5 AND rating <= 5.0 AND rating::text ~ '^[0-9]+\.?[05]?$');

-- Update school_reviews table to support decimal ratings  
ALTER TABLE public.school_reviews 
  ALTER COLUMN rating TYPE DECIMAL(2,1),
  DROP CONSTRAINT IF EXISTS school_reviews_rating_check,
  ADD CONSTRAINT school_reviews_rating_check CHECK (rating >= 0.5 AND rating <= 5.0 AND rating::text ~ '^[0-9]+\.?[05]?$');

-- Add comment to explain the rating constraint
COMMENT ON CONSTRAINT program_reviews_rating_check ON public.program_reviews IS 'Ratings must be between 0.5 and 5.0 in 0.5 increments (half-stars)';
COMMENT ON CONSTRAINT school_reviews_rating_check ON public.school_reviews IS 'Ratings must be between 0.5 and 5.0 in 0.5 increments (half-stars)';
