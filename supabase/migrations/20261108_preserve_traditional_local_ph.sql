-- Additive schema change required before deploying the owner V2 mapping.
-- No existing property rows are updated; existing enum labels remain valid.
ALTER TYPE public.property_type ADD VALUE IF NOT EXISTS 'local';
ALTER TYPE public.property_type ADD VALUE IF NOT EXISTS 'ph';
