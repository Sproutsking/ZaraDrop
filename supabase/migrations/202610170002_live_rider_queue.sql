grant select on public.profiles, public.orders, public.order_items, public.order_messages to authenticated;
grant select on public.vendors, public.menu_items to anon, authenticated;
grant insert, update on public.vendors to authenticated;
grant insert, update, delete on public.menu_items to authenticated;
grant insert on public.order_messages to authenticated;

drop function if exists public.available_rider_orders();

create function public.available_rider_orders()
returns table (
  id uuid,
  order_number bigint,
  vendor_id uuid,
  vendor_name text,
  vendor_emoji text,
  pickup_address text,
  delivery_address text,
  customer_note text,
  currency text,
  delivery_fee numeric,
  total numeric,
  eta_minutes integer,
  created_at timestamptz,
  order_items jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.current_app_role() <> 'rider'::public.app_role then
    raise exception 'Rider sign-in required';
  end if;

  return query
    select
      o.id,
      o.order_number,
      o.vendor_id,
      v.name,
      v.emoji,
      v.pickup_address,
      o.delivery_address,
      o.customer_note,
      o.currency,
      o.delivery_fee,
      o.total,
      o.eta_minutes,
      o.created_at,
      coalesce(
        (select jsonb_agg(jsonb_build_object(
          'item_name', oi.item_name,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price
        ) order by oi.created_at) from public.order_items as oi where oi.order_id = o.id),
        '[]'::jsonb
      )
    from public.orders as o
    join public.vendors as v on v.id = o.vendor_id
    where o.rider_id is null and o.status in ('placed', 'preparing', 'ready')
    order by o.created_at;
end;
$$;

revoke all on function public.available_rider_orders() from public;
grant execute on function public.available_rider_orders() to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'vendors'
  ) then alter publication supabase_realtime add table public.vendors; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'menu_items'
  ) then alter publication supabase_realtime add table public.menu_items; end if;
end
$$;
