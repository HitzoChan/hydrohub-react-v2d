-- Safe, non-destructive migration for walk-in reservations.
-- Existing customer_id values, rows, indexes, and constraints are preserved.
BEGIN;

-- Registered orders still store their customer ID. Walk-in orders use NULL.
ALTER TABLE public.orders
ALTER COLUMN customer_id DROP NOT NULL;

-- Reservations created before payment handling was added should also be
-- treated as COD so they can enter Delivery Management.
UPDATE public.orders
SET payment_method = 'COD'
WHERE delivery_type = 'scheduled'
	AND reservation_status IN ('pending', 'scheduled')
	AND (payment_method IS NULL OR btrim(payment_method) = '');

COMMIT;