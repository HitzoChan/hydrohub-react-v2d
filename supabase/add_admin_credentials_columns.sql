-- Add admin credential columns to existing system_settings table

-- Add admin_email column if it doesn't exist
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS admin_email text DEFAULT 'admin@gmail.com';

-- Add admin_name column if it doesn't exist
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS admin_name text DEFAULT 'Administrator';

-- Add admin_password column if it doesn't exist
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS admin_password text DEFAULT '123456';

-- Add updated_at column if it doesn't exist (for tracking updates)
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT now();
