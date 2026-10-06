ALTER TABLE public.system_settings
ADD COLUMN IF NOT EXISTS gcash_qr_code_url text NULL;