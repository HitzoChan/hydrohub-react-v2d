-- ============================================
-- HYDROHUB FEEDBACK TABLE RLS
-- Allow admin reply updates on feedback records
-- ============================================
-- Copy and paste this entire script into Supabase SQL Editor and run it

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feedback_select_all" ON public.feedback;
DROP POLICY IF EXISTS "feedback_insert_all" ON public.feedback;
DROP POLICY IF EXISTS "feedback_update_all" ON public.feedback;
DROP POLICY IF EXISTS "feedback_delete_all" ON public.feedback;

CREATE POLICY "feedback_select_all"
ON public.feedback
FOR SELECT
USING (true);

CREATE POLICY "feedback_insert_all"
ON public.feedback
FOR INSERT
WITH CHECK (true);

CREATE POLICY "feedback_update_all"
ON public.feedback
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "feedback_delete_all"
ON public.feedback
FOR DELETE
USING (true);
