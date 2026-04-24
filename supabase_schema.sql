create table public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  role text check (role in ('owner', 'seeker', 'admin')) default 'seeker',
  phone_number text
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'role', 'seeker')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Properties Table
create table public.properties (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  owner_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  price numeric not null,
  location text not null,
  type text not null,
  bedrooms numeric,
  bathrooms numeric,
  area_size numeric,
  image_url text,
  status text check (status in ('available', 'rented')) default 'available'
);

alter table public.properties enable row level security;

create policy "Properties are viewable by everyone."
  on public.properties for select
  using ( true );

create policy "Owners can insert their own properties."
  on public.properties for insert
  with check ( auth.uid() = owner_id );

create policy "Owners can update own properties."
  on public.properties for update
  using ( auth.uid() = owner_id );

create policy "Owners can delete own properties."
  on public.properties for delete
  using ( auth.uid() = owner_id );

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- SAFE UPDATE: RUN THIS IF YOU HAVE ERRORS!
-- ==========================================

-- Safely add missing columns to your properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS bedrooms numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS bathrooms numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS area_size numeric;

-- Safely create the Storage bucket (skips if it already exists)
INSERT INTO storage.buckets (id, name, public) VALUES ('properties', 'properties', true)
ON CONFLICT (id) DO NOTHING;

-- Clean up any duplicate image policies, just in case
DROP POLICY IF EXISTS "Images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images." ON storage.objects;

-- Create the required image upload policies
CREATE POLICY "Images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'properties' );

CREATE POLICY "Authenticated users can upload images."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'properties' AND auth.role() = 'authenticated' );
