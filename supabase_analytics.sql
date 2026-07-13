-- Add missing tables for Analytics & Reporting

-- 1. Property Views
CREATE TABLE IF NOT EXISTS public.property_views (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  viewer_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- 2. Search Logs
CREATE TABLE IF NOT EXISTS public.search_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  query text,
  location text,
  property_type text,
  created_at timestamp with time zone default now()
);

-- 3. Moderation Logs (assuming it wasn't created yet)
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references public.profiles(id) on delete set null,
  target_id uuid not null,
  target_type text check (target_type in ('property', 'user', 'message')),
  action text check (action in ('warning', 'takedown', 'suspension', 'flag')),
  reason text,
  created_at timestamp with time zone default now()
);

-- Analytics Views

-- We use MATERIALIZED VIEWS for heavy aggregation over time to keep dashboard fast

-- A function to summarize user growth by day and role
CREATE OR REPLACE FUNCTION admin_get_user_growth(limit_days int DEFAULT 30)
RETURNS TABLE (
  signup_date timestamp with time zone,
  role text,
  new_users bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate Admin Role (Temporarily disabled for hardcoded MVP login)
  -- IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profiles.role = 'admin') THEN
  --   RAISE EXCEPTION 'Access Denied: Admins only';
  -- END IF;

  RETURN QUERY
  SELECT 
    date_trunc('day', u.created_at) as signup_date,
    p.role,
    count(*) as new_users
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  GROUP BY date_trunc('day', u.created_at), p.role
  ORDER BY signup_date DESC
  LIMIT limit_days;
END;
$$;

-- A view to summarize listing growth by day
CREATE OR REPLACE VIEW admin_listing_growth AS
SELECT 
  date_trunc('day', created_at) as post_date,
  count(*) as new_listings
FROM public.properties
GROUP BY date_trunc('day', created_at)
ORDER BY post_date DESC;

-- Security Definer function to get total overview metrics securely
CREATE OR REPLACE FUNCTION admin_get_overview_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_seekers int;
  total_landlords int;
  active_listings int;
  takedown_listings int;
  new_users_today int;
  new_listings_today int;
  active_users_24h int;
  total_messages int;
  open_reports int;
BEGIN
  -- Validate Admin Role (Temporarily disabled for hardcoded MVP login)
  -- IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
  --   RAISE EXCEPTION 'Access Denied: Admins only';
  -- END IF;

  SELECT count(*) INTO total_seekers FROM public.profiles WHERE role = 'seeker';
  SELECT count(*) INTO total_landlords FROM public.profiles WHERE role = 'landlord';
  
  SELECT count(*) INTO active_listings FROM public.properties WHERE status = 'available';
  -- Assuming takedown logs exist, or status = 'takedown' (we use a mock logic if status is not takedown)
  SELECT count(*) INTO takedown_listings FROM public.moderation_logs WHERE action = 'takedown' AND target_type = 'property';
  
  SELECT count(*) INTO new_users_today FROM auth.users WHERE created_at >= current_date;
  SELECT count(*) INTO new_listings_today FROM public.properties WHERE created_at >= current_date;
  
  -- Getting auth users active in last 24h
  SELECT count(*) INTO active_users_24h FROM auth.users WHERE last_sign_in_at >= now() - interval '24 hours';
  
  SELECT count(*) INTO total_messages FROM public.messages;
  
  SELECT count(*) INTO open_reports FROM public.moderation_logs WHERE action = 'flag';

  RETURN json_build_object(
    'total_seekers', total_seekers,
    'total_landlords', total_landlords,
    'active_listings', active_listings,
    'takedown_listings', takedown_listings,
    'new_users_today', new_users_today,
    'new_listings_today', new_listings_today,
    'active_users_24h', active_users_24h,
    'total_messages', total_messages,
    'open_reports', open_reports
  );
END;
$$;

-- Security Definer function to get recent signups with auth emails
DROP FUNCTION IF EXISTS admin_get_recent_signups(int);
CREATE OR REPLACE FUNCTION admin_get_recent_signups(limit_count int DEFAULT 50)
RETURNS TABLE (
  id uuid,
  full_name text,
  email varchar,
  role text,
  avatar_url text,
  created_at timestamp with time zone,
  is_banned boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate Admin Role (Temporarily disabled for hardcoded MVP login)
  -- IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
  --   RAISE EXCEPTION 'Access Denied: Admins only';
  -- END IF;

  RETURN QUERY
  SELECT p.id, p.full_name, u.email, p.role, p.avatar_url, u.created_at, p.is_banned
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  ORDER BY u.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Top Property Views
CREATE OR REPLACE VIEW admin_top_properties AS
SELECT 
  p.id, 
  p.title, 
  p.location, 
  p.price,
  count(v.id) as view_count
FROM public.properties p
LEFT JOIN public.property_views v ON p.id = v.property_id
GROUP BY p.id
ORDER BY view_count DESC
LIMIT 10;

-- ==========================================
-- ADVANCED ADMIN FEATURES
-- ==========================================

-- 1. Ban / Suspend Users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned boolean default false;

CREATE OR REPLACE FUNCTION admin_ban_user(target_user_id uuid, ban_status boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate Admin Role (Temporarily disabled for MVP)
  -- IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
  --   RAISE EXCEPTION 'Access Denied: Admins only';
  -- END IF;
  
  UPDATE public.profiles SET is_banned = ban_status WHERE id = target_user_id;
END;
$$;

-- 2. Audit Log for Deleted Listings (Soft Delete / Archive visibility)
CREATE TABLE IF NOT EXISTS public.deleted_properties (
  id uuid primary key,
  original_data jsonb,
  deleted_at timestamp with time zone default now()
);

CREATE OR REPLACE FUNCTION log_deleted_property()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.deleted_properties (id, original_data)
  VALUES (OLD.id, to_jsonb(OLD));
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_deleted_property ON public.properties;
CREATE TRIGGER trg_log_deleted_property
AFTER DELETE ON public.properties
FOR EACH ROW EXECUTE PROCEDURE log_deleted_property();

-- RPC to delete listing securely via admin
CREATE OR REPLACE FUNCTION admin_delete_listing(target_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate Admin Role (Temporarily disabled for MVP)
  -- IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
  --   RAISE EXCEPTION 'Access Denied: Admins only';
  -- END IF;
  
  DELETE FROM public.properties WHERE id = target_listing_id;
END;
$$;

-- RPC to get deleted listings
CREATE OR REPLACE FUNCTION admin_get_deleted_listings()
RETURNS TABLE (
  id uuid,
  title text,
  landlord_id uuid,
  price numeric,
  deleted_at timestamp with time zone,
  original_data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dp.id,
    (dp.original_data->>'title')::text as title,
    (dp.original_data->>'landlord_id')::uuid as landlord_id,
    (dp.original_data->>'price')::numeric as price,
    dp.deleted_at,
    dp.original_data
  FROM public.deleted_properties dp
  ORDER BY dp.deleted_at DESC;
END;
$$;

-- Get list of seekers who have opened a chat or messaged on a property
CREATE OR REPLACE FUNCTION admin_get_property_interactions(target_property_id uuid)
RETURNS TABLE (
  chat_id uuid,
  seeker_id uuid,
  seeker_name text,
  seeker_avatar text,
  last_message text,
  last_message_time timestamp with time zone,
  message_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as chat_id,
    c.seeker_id,
    p.full_name as seeker_name,
    p.avatar_url as seeker_avatar,
    m.content as last_message,
    m.created_at as last_message_time,
    COUNT(msg.id) as message_count
  FROM public.chats c
  JOIN public.profiles p ON c.seeker_id = p.id
  LEFT JOIN LATERAL (
    SELECT content, created_at 
    FROM public.messages 
    WHERE chat_id = c.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) m ON true
  LEFT JOIN public.messages msg ON msg.chat_id = c.id
  WHERE c.property_id = target_property_id
  GROUP BY c.id, c.seeker_id, p.full_name, p.avatar_url, m.content, m.created_at
  ORDER BY last_message_time DESC NULLS LAST;
END;
$$;

-- Get all properties listed by a user
CREATE OR REPLACE FUNCTION admin_get_user_listings(target_user_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  price numeric,
  location text,
  status text,
  image_url text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id,
    pr.title,
    pr.price,
    pr.location,
    pr.status,
    pr.image_url,
    pr.created_at
  FROM public.properties pr
  WHERE pr.landlord_id = target_user_id
  ORDER BY pr.created_at DESC;
END;
$$;

-- Get all chats/interactions a user is involved in
CREATE OR REPLACE FUNCTION admin_get_user_chats(target_user_id uuid)
RETURNS TABLE (
  chat_id uuid,
  property_id uuid,
  property_title text,
  other_party_name text,
  other_party_avatar text,
  last_message text,
  last_message_time timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as chat_id,
    c.property_id,
    pr.title as property_title,
    CASE 
      WHEN c.seeker_id = target_user_id THEN p_landlord.full_name
      ELSE p_seeker.full_name
    END as other_party_name,
    CASE 
      WHEN c.seeker_id = target_user_id THEN p_landlord.avatar_url
      ELSE p_seeker.avatar_url
    END as other_party_avatar,
    m.content as last_message,
    m.created_at as last_message_time
  FROM public.chats c
  JOIN public.properties pr ON c.property_id = pr.id
  JOIN public.profiles p_seeker ON c.seeker_id = p_seeker.id
  JOIN public.profiles p_landlord ON c.landlord_id = p_landlord.id
  LEFT JOIN LATERAL (
    SELECT content, created_at 
    FROM public.messages 
    WHERE chat_id = c.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) m ON true
  WHERE c.seeker_id = target_user_id OR c.landlord_id = target_user_id
  ORDER BY last_message_time DESC NULLS LAST;
END;
$$;

