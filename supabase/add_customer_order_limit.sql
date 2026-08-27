alter table public.system_settings
add column if not exists max_active_orders_per_customer integer not null default 3;

alter table public.system_settings
drop constraint if exists system_settings_max_active_orders_per_customer_check;

alter table public.system_settings
add constraint system_settings_max_active_orders_per_customer_check
check (max_active_orders_per_customer > 0);
