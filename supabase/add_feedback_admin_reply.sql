ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS admin_reply text,
  ADD COLUMN IF NOT EXISTS admin_replied_at timestamptz;

COMMENT ON COLUMN public.feedback.admin_reply IS 'Admin response to the customer feedback';
COMMENT ON COLUMN public.feedback.admin_replied_at IS 'When the admin replied to the feedback';
