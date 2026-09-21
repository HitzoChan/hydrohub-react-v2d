CREATE TABLE IF NOT EXISTS public.inventory_adjustments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  capacity text NOT NULL,
  adjustment_type text NOT NULL CHECK (adjustment_type IN ('new_purchase', 'repaired', 'recovered')),
  quantity integer NOT NULL CHECK (quantity > 0),
  notes text NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT inventory_adjustments_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_product
  ON public.inventory_adjustments(product_id, created_at);

ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'inventory_adjustments'
      AND policyname = 'Enable all inventory adjustment access'
  ) THEN
    CREATE POLICY "Enable all inventory adjustment access"
      ON public.inventory_adjustments
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;