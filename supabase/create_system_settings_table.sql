-- Create system_settings table with admin credentials support
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- Base pricing
  base_price numeric NULL,
  with_exchange_price numeric NULL,
  
  -- Delivery settings
  max_deliveries_per_driver integer NULL,
  delivery_duration integer NULL,
  
  -- COD settings
  cod_enabled boolean NULL DEFAULT false,
  cod_verification boolean NULL DEFAULT false,
  auto_generate_code boolean NULL DEFAULT false,
  code_length integer NULL,
  
  -- GCash settings
  gcash_enabled boolean NULL DEFAULT true,
  gcash_number text NULL,
  gcash_account_name text NULL,
  require_reference boolean NULL DEFAULT true,
  
  -- Down payment settings
  downpayment_enabled boolean NULL DEFAULT true,
  minimum_gallons integer NULL DEFAULT 10,
  downpayment_percentage integer NULL DEFAULT 30,
  
  -- Security settings
  max_active_orders_per_customer integer NOT NULL DEFAULT 3,
  
  -- Admin account settings
  admin_email text NULL DEFAULT 'admin@gmail.com'::text,
  admin_name text NULL DEFAULT 'Administrator'::text,
  admin_password text NULL DEFAULT '123456'::text,
  
  -- Timestamps
  created_at timestamp without time zone NULL DEFAULT now(),
  updated_at timestamp without time zone NULL DEFAULT now(),
  
  CONSTRAINT system_settings_pkey PRIMARY KEY (id),
  CONSTRAINT system_settings_max_active_orders_per_customer_check 
    CHECK ((max_active_orders_per_customer > 0))
) TABLESPACE pg_default;

-- Create index on created_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_system_settings_created_at 
ON public.system_settings(created_at DESC) TABLESPACE pg_default;

-- Enable RLS (Row Level Security)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow admin to update system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow admin to insert system settings" ON public.system_settings;

-- Create permissive RLS policies to allow all operations
-- (This app uses localStorage-based auth, not Supabase Auth sessions)
CREATE POLICY "Allow all read access" 
ON public.system_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all insert access" 
ON public.system_settings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all update access" 
ON public.system_settings 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all delete access" 
ON public.system_settings 
FOR DELETE 
USING (true);
