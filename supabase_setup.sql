-- NEST APP SUPABASE INITIALIZATION SCRIPT
-- Run this in the Supabase SQL Editor

-- 1. PROFILES TABLE (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'tenant', -- 'tenant' or 'landlord'
  rating FLOAT DEFAULT 5.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. LISTINGS TABLE
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  price DECIMAL NOT NULL,
  property_type TEXT NOT NULL, -- 'Apartment', 'House', 'Studio', 'Villa'
  beds INTEGER NOT NULL,
  baths INTEGER NOT NULL,
  sqft INTEGER,
  description TEXT,
  images TEXT[], -- Array of image URLs

  emoji TEXT DEFAULT '🏠',
  is_verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'Available', -- 'Available', 'Taken'
  amenities TEXT[], -- Array of strings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SAVED LISTINGS (Favorites)
CREATE TABLE IF NOT EXISTS public.saved_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- 4. CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  last_message TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) SETTINGS

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Listings Policies
DROP POLICY IF EXISTS "Listings are viewable by everyone" ON public.listings;
CREATE POLICY "Listings are viewable by everyone" ON public.listings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Landlords can insert listings" ON public.listings;
CREATE POLICY "Landlords can insert listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Landlords can update own listings" ON public.listings;
CREATE POLICY "Landlords can update own listings" ON public.listings FOR UPDATE USING (auth.uid() = landlord_id);

-- Saved Listings Policies
DROP POLICY IF EXISTS "Users can view own saved listings" ON public.saved_listings;
CREATE POLICY "Users can view own saved listings" ON public.saved_listings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved listings" ON public.saved_listings;
CREATE POLICY "Users can insert own saved listings" ON public.saved_listings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved listings" ON public.saved_listings;
CREATE POLICY "Users can delete own saved listings" ON public.saved_listings FOR DELETE USING (auth.uid() = user_id);

-- Conversations Policies
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations" ON public.conversations FOR SELECT 
USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);

-- Messages Policies
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
CREATE POLICY "Participants can view messages" ON public.messages FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.conversations 
  WHERE public.conversations.id = public.messages.conversation_id 
  AND (public.conversations.tenant_id = auth.uid() OR public.conversations.landlord_id = auth.uid())
));

DROP POLICY IF EXISTS "Participants can insert messages" ON public.messages;
CREATE POLICY "Participants can insert messages" ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- FUNCTION TO HANDLE NEW USER SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'tenant')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER ON AUTH SIGNUP
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── MIGRATIONS (safe to re-run) ──────────────────────────────
-- Add 'available' column for mark taken/available feature
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT TRUE;

-- Add 'landlord_name' for display without joining profiles
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS landlord_name TEXT;

-- Add 'type' column alias (property_type is the DB column, apps use 'type')
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS type TEXT;

-- Sync type from property_type where null
UPDATE public.listings SET type = property_type WHERE type IS NULL;

-- Add 'phone' column for WhatsApp connectivity
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3. LANDLORD REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.landlord_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_name TEXT,
  landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies for Reviews
ALTER TABLE public.landlord_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view landlord reviews" ON public.landlord_reviews;
CREATE POLICY "Anyone can view landlord reviews" ON public.landlord_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.landlord_reviews;
CREATE POLICY "Authenticated users can insert reviews" ON public.landlord_reviews FOR INSERT WITH CHECK (auth.uid() = tenant_id);


-- 6. STORAGE BUCKET FOR LISTING MEDIA (Images & Videos)
-- Create bucket 'listings' if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

-- Set up access policies for the listings bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'listings');

DROP POLICY IF EXISTS "Authenticated Landlord Upload" ON storage.objects;
CREATE POLICY "Authenticated Landlord Upload" ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'listings');

DROP POLICY IF EXISTS "Landlords can update own objects" ON storage.objects;
CREATE POLICY "Landlords can update own objects" ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'listings');

DROP POLICY IF EXISTS "Landlords can delete own objects" ON storage.objects;
CREATE POLICY "Landlords can delete own objects" ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'listings');


-- 7. ADDITIONAL RLS POLICIES FOR CONVERSATIONS (Production Messaging Security)
DROP POLICY IF EXISTS "Participants can insert conversations" ON public.conversations;
CREATE POLICY "Participants can insert conversations" ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = tenant_id OR auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations" ON public.conversations FOR UPDATE
USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);
