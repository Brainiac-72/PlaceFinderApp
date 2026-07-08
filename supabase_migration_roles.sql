-- STEP 1: Fix the role constraint to allow 'landlord'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
UPDATE public.profiles SET role = 'landlord' WHERE role = 'owner';
UPDATE public.profiles SET role = 'seeker' WHERE role IS NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role in ('landlord', 'seeker', 'admin'));

-- STEP 2: Update the auth trigger so it stops crashing
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

-- ONLY RUN THESE TWO STEPS to guarantee successful registration!
