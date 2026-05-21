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

-- ==========================================
-- AVATARS STORAGE BUCKET
-- ==========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their avatars." ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

CREATE POLICY "Users can upload avatars."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can update their avatars."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Notifications Table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  body text not null,
  type text default 'info',
  data jsonb default '{}',
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies
create policy "Users can see their own notifications"
  on public.notifications for select
  using ( auth.uid() = user_id );

create policy "Users can update their own notifications"
  on public.notifications for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own notifications"
  on public.notifications for delete
  using ( auth.uid() = user_id );

-- ==========================================
-- CHATS & MESSAGING
-- ==========================================

create table public.chats (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  seeker_id uuid references public.profiles(id) not null,
  owner_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.chats enable row level security;

-- A user can see a chat if they are either the seeker or the owner
create policy "Users can view their own chats"
  on public.chats for select
  using ( auth.uid() = seeker_id or auth.uid() = owner_id );

-- A user can create a chat if they are the seeker
create policy "Seekers can create chats"
  on public.chats for insert
  with check ( auth.uid() = seeker_id );

create table public.messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references public.chats(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.messages enable row level security;

-- A user can see messages in a chat they belong to
create policy "Users can view messages in their chats"
  on public.messages for select
  using (
    exists (
      select 1 from public.chats c
      where c.id = chat_id and (c.seeker_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

-- A user can insert messages into a chat they belong to, and they must be the sender
create policy "Users can send messages in their chats"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.chats c
      where c.id = chat_id and (c.seeker_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

-- A user can update messages (e.g. mark as read) if they are in the chat
create policy "Users can update messages in their chats"
  on public.messages for update
  using (
    exists (
      select 1 from public.chats c
      where c.id = chat_id and (c.seeker_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

-- ==========================================
-- MULTI-PROPERTY MESSAGING UPDATES
-- ==========================================

-- Add an optional attached property to messages so users can share properties in chat
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attached_property_id uuid references public.properties(id) on delete set null;
