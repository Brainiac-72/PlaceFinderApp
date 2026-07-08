-- Drop the old status constraint
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_status_check;

-- Add the new status constraint that supports 'available', 'taken', and 'in_negotiations'
ALTER TABLE public.properties ADD CONSTRAINT properties_status_check CHECK (status in ('available', 'taken', 'in_negotiations', 'rented'));
