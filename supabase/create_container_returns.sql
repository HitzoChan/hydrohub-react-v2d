CREATE TABLE IF NOT EXISTS public.container_returns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NULL,
  driver_id text NULL,
  customer_id text NULL,
  customer_name text NULL,
  capacity text NOT NULL,
  expected_quantity integer NOT NULL DEFAULT 0,
  returned_quantity integer NOT NULL DEFAULT 0,
  damaged_quantity integer NOT NULL DEFAULT 0,
  missing_quantity integer NOT NULL DEFAULT 0,
  notes text NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT container_returns_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_container_returns_order
  ON public.container_returns(order_id);

CREATE INDEX IF NOT EXISTS idx_container_returns_driver
  ON public.container_returns(driver_id);

ALTER TABLE public.container_returns ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'container_returns'
      AND policyname = 'Enable all container return access'
  ) THEN
    CREATE POLICY "Enable all container return access"
      ON public.container_returns
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;
