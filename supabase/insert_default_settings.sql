-- Insert default system settings record if table is empty
INSERT INTO public.system_settings (
  admin_email,
  admin_name,
  admin_password,
  base_price,
  with_exchange_price,
  cod_enabled,
  cod_verification,
  gcash_enabled,
  gcash_number,
  gcash_account_name,
  downpayment_enabled,
  minimum_gallons,
  downpayment_percentage,
  max_active_orders_per_customer
)
SELECT 
  'admin@gmail.com',
  'Administrator',
  '123456',
  NULL,
  NULL,
  false,
  false,
  true,
  NULL,
  NULL,
  true,
  10,
  30,
  3
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings);
