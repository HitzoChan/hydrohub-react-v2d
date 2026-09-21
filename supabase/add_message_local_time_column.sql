ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS sent_local_time text;
