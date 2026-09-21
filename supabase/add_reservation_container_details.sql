-- Container details used by reservation and inventory workflows.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS exchange_containers integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS new_containers integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS borrow_containers integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS with_exchange boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS exchange_required boolean NULL,
  ADD COLUMN IF NOT EXISTS borrow_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS borrow_notes text NULL;