-- ============================================
-- HYDROHUB SYSTEM SETTINGS TABLE
-- Complete setup for admin credentials & system configuration
-- ============================================
-- Copy and paste this entire script into Supabase SQL Editor and run it

-- Step 1: Create the system_settings table (if it doesn't exist)
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
  
  -- Admin account settings (NEW - for changeable credentials)
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

-- Step 2: Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_system_settings_created_at 
ON public.system_settings(created_at DESC) TABLESPACE pg_default;

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop old restrictive policies if they exist
DROP POLICY IF EXISTS "Allow read access to system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow admin to update system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow admin to insert system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow all read access" ON public.system_settings;
DROP POLICY IF EXISTS "Allow all insert access" ON public.system_settings;
DROP POLICY IF EXISTS "Allow all update access" ON public.system_settings;
DROP POLICY IF EXISTS "Allow all delete access" ON public.system_settings;

-- Step 5: Create PERMISSIVE RLS policies (allows all operations)
-- Note: The app uses localStorage-based auth, NOT Supabase Auth sessions
-- So we need permissive policies without "TO authenticated" restrictions
CREATE POLICY "Enable all read access" 
ON public.system_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Enable all insert access" 
ON public.system_settings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable all update access" 
ON public.system_settings 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all delete access" 
ON public.system_settings 
FOR DELETE 
USING (true);

-- Step 6: Insert default system settings (if table is empty)
INSERT INTO public.system_settings (
  admin_email,
  admin_name,
  admin_password,
  cod_enabled,
  cod_verification,
  gcash_enabled,
  gcash_number,
  gcash_account_name,
  downpayment_enabled,
  minimum_gallons,
  downpayment_percentage,
  max_active_orders_per_customer
)
SELECT 
  'admin@gmail.com',
  'Administrator',
  '123456',
  false,
  false,
  true,
  NULL,
  NULL,
  true,
  10,
  30,
  3
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings);

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Default Login Credentials:
-- Email: admin@gmail.com
-- Password: 123456
--
-- How to change credentials:
-- 1. Login to HydroHub with default credentials
-- 2. Go to Settings > Account
-- 3. Update:
--    - Administrator Name
--    - Email Address (this becomes your new login email)
--    - New Password (leave blank to keep current password)
-- 4. Click "Save Changes"
-- ============================================
