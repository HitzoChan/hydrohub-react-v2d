-- Fix RLS policies for system_settings table
-- The app uses localStorage-based auth, not Supabase Auth sessions
-- So we need permissive policies that allow all operations

-- Drop the old restrictive policies that require Supabase Auth
DROP POLICY IF EXISTS "Allow read access to system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow admin to update system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow admin to insert system settings" ON public.system_settings;

-- Enable RLS if not already enabled
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies to allow all operations
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
