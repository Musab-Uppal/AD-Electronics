-- Production-safe migration: enforce cascade delete from customers -> orders -> order_payments
begin;

-- Keep the overall_time constraint in place for integer months > 0 when provided.
alter table if exists public.orders
  add column if not exists overall_time integer;

alter table if exists public.orders
  drop constraint if exists orders_overall_time_check;

alter table if exists public.orders
  add constraint orders_overall_time_check
  check (overall_time is null or overall_time > 0);

-- Ensure customer delete cascades to orders.
alter table if exists public.orders
  drop constraint if exists orders_customer_phone_fkey;

alter table if exists public.orders
  add constraint orders_customer_phone_fkey
  foreign key (customer_phone)
  references public.customers(phone)
  on update cascade
  on delete cascade;

-- Ensure order delete cascades to payments.
alter table if exists public.order_payments
  drop constraint if exists order_payments_order_id_fkey;

alter table if exists public.order_payments
  add constraint order_payments_order_id_fkey
  foreign key (order_id)
  references public.orders(id)
  on delete cascade;

commit;
