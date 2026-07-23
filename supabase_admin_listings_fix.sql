-- Create RPC to securely allow admins to insert properties
CREATE OR REPLACE FUNCTION admin_create_listing(
  p_landlord_id uuid,
  p_title text,
  p_type text,
  p_price numeric,
  p_price_period text,
  p_location text,
  p_bedrooms integer,
  p_bathrooms integer,
  p_area_size numeric,
  p_description text,
  p_image_url text,
  p_status text,
  p_amenities jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.properties (
    landlord_id, title, type, price, price_period, location, 
    bedrooms, bathrooms, area_size, description, image_url, status, amenities
  ) VALUES (
    p_landlord_id, p_title, p_type, p_price, p_price_period, p_location,
    p_bedrooms, p_bathrooms, p_area_size, p_description, p_image_url, p_status, p_amenities
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;
