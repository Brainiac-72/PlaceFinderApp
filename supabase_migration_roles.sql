-- Step 1: Drop the old constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Update existing profiles so they comply with the new constraint
UPDATE public.profiles SET role = 'landlord' WHERE role = 'owner';
-- Default users without a role to 'seeker'
UPDATE public.profiles SET role = 'seeker' WHERE role IS NULL;

-- Step 3: Add the new constraint
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role in ('landlord', 'seeker', 'admin'));

-- Step 3: Update properties table column name from owner_id to landlord_id
ALTER TABLE public.properties RENAME COLUMN owner_id TO landlord_id;

-- Step 4: Update chats table column name from owner_id to landlord_id
ALTER TABLE public.chats RENAME COLUMN owner_id TO landlord_id;

-- Step 5: Update the trigger to use the updated role enum
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

-- Step 6: Fix RLS policies for properties table
DROP POLICY IF EXISTS "Owners can insert their own properties." ON public.properties;
DROP POLICY IF EXISTS "Owners can update own properties." ON public.properties;
DROP POLICY IF EXISTS "Owners can delete own properties." ON public.properties;

create policy "Landlords can insert their own properties."
  on public.properties for insert
  with check ( auth.uid() = landlord_id AND exists (select 1 from public.profiles where id = auth.uid() and role = 'landlord') );

create policy "Landlords can update own properties."
  on public.properties for update
  using ( auth.uid() = landlord_id AND exists (select 1 from public.profiles where id = auth.uid() and role = 'landlord') );

create policy "Landlords can delete own properties."
  on public.properties for delete
  using ( auth.uid() = landlord_id AND exists (select 1 from public.profiles where id = auth.uid() and role = 'landlord') );

-- Step 7: Fix RLS policies for chats table
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their chats" ON public.messages;

create policy "Users can view their own chats"
  on public.chats for select
  using ( auth.uid() = seeker_id or auth.uid() = landlord_id );

create policy "Users can view messages in their chats"
  on public.messages for select
  using (
    exists (
      select 1 from public.chats c
      where c.id = chat_id and (c.seeker_id = auth.uid() or c.landlord_id = auth.uid())
    )
  );

create policy "Users can send messages in their chats"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.chats c
      where c.id = chat_id and (c.seeker_id = auth.uid() or c.landlord_id = auth.uid())
    )
  );

create policy "Users can update messages in their chats"
  on public.messages for update
  using (
    exists (
      select 1 from public.chats c
      where c.id = chat_id and (c.seeker_id = auth.uid() or c.landlord_id = auth.uid())
    )
  );
