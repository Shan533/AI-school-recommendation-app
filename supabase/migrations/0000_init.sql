-- Create the profiles table, linked to auth.users
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  profile_pic_url text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON profiles FOR UPDATE WITH CHECK (auth.uid() = id);

-- Create the schools table
CREATE TABLE public.schools (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  initial text,
  type text,
  country text,
  location text,
  year_founded integer,
  qs_ranking integer,
  website_url text,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Schools are viewable by everyone." ON schools FOR SELECT USING (true);
CREATE POLICY "Admins can create schools." ON schools FOR INSERT WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Admins can update schools." ON schools FOR UPDATE WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Admins can delete schools." ON schools FOR DELETE USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);

-- Create the programs table
CREATE TABLE public.programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  initial text,
  school_id uuid NOT NULL REFERENCES schools(id),
  degree text NOT NULL,
  website_url text,
  duration_months integer,
  currency text,
  total_tuition integer,
  is_stem boolean,
  description text,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Programs are viewable by everyone." ON programs FOR SELECT USING (true);
CREATE POLICY "Admins can create programs." ON programs FOR INSERT WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Admins can update programs." ON programs FOR UPDATE WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Admins can delete programs." ON programs FOR DELETE USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);

-- Create the program_reviews table
CREATE TABLE public.program_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users,
  program_id uuid NOT NULL REFERENCES programs(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.program_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone." ON program_reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reviews." ON program_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews." ON program_reviews FOR UPDATE WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews." ON program_reviews FOR DELETE USING (auth.uid() = user_id);

-- Create the school_reviews table
CREATE TABLE public.school_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  user_id uuid NOT NULL REFERENCES auth.users,
  school_id uuid NOT NULL REFERENCES schools(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.school_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone." ON school_reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reviews." ON school_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews." ON school_reviews FOR UPDATE WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews." ON school_reviews FOR DELETE USING (auth.uid() = user_id);

-- Create the collections table
CREATE TABLE public.collections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Collections are viewable by owner." ON collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own collections." ON collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own collections." ON collections FOR UPDATE WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own collections." ON collections FOR DELETE USING (auth.uid() = user_id);

-- Create the collection_items table
CREATE TABLE public.collection_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Collection items are viewable by owner." ON collection_items FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM collections WHERE id = collection_id)
);
CREATE POLICY "Users can insert their own collection items." ON collection_items FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM collections WHERE id = collection_id)
);
CREATE POLICY "Users can delete their own collection items." ON collection_items FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM collections WHERE id = collection_id)
);
