-- ============================================
-- SETUP RLS & DEFAULT DATA FOR EXISTING TABLE
-- Use this for your existing system_settings table
-- ============================================

-- Step 1: Enable Row Level Security (RLS)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any old policies if they exist
DROP POLICY IF EXISTS "Allow read access to system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow admin to update system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow admin to insert system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Enable all read access" ON public.system_settings;
DROP POLICY IF EXISTS "Enable all insert access" ON public.system_settings;
DROP POLICY IF EXISTS "Enable all update access" ON public.system_settings;
DROP POLICY IF EXISTS "Enable all delete access" ON public.system_settings;

-- Step 3: Create PERMISSIVE RLS policies (allows all operations)
-- The app uses localStorage-based auth, NOT Supabase Auth sessions
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

-- Step 4: Insert default system settings (if table is empty)
INSERT INTO public.system_settings (
  admin_email,
  admin_name,
  admin_password,
  cod_enabled,
  cod_verification,
  gcash_enabled,
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
  true,
  10,
  30,
  3
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings);

-- ============================================
-- ✅ DONE!
-- ============================================
-- Default Login Credentials:
-- Email: admin@gmail.com
-- Password: 123456
--
-- Your app is now ready to use!
-- Users can change credentials in Settings > Account
-- ============================================
