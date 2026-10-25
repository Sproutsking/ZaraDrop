create table public.rider_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  is_available boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.rider_presence enable row level security;

create policy rider_presence_read_self_or_ops on public.rider_presence
  for select to authenticated using (user_id = (select auth.uid()) or public.is_ops());

grant select on public.rider_presence to authenticated;

create or replace function public.set_rider_availability(p_is_available boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if public.current_app_role() <> 'rider'::public.app_role then
    raise exception 'Rider role required';
  end if;

  insert into public.rider_presence(user_id, is_available, updated_at)
  values (v_user_id, p_is_available, now())
  on conflict (user_id) do update
  set is_available = excluded.is_available,
      updated_at = excluded.updated_at;

  return p_is_available;
end;
$$;

revoke all on function public.set_rider_availability(boolean) from public, anon;
grant execute on function public.set_rider_availability(boolean) to authenticated;

create or replace function public.available_rider_orders()
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
  payment_method text,
  payment_status text,
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
      o.payment_method,
      o.payment_status,
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
    where o.rider_id is null
      and o.status in ('placed', 'preparing', 'ready')
      and exists (
        select 1 from public.rider_presence as presence
        where presence.user_id = auth.uid() and presence.is_available
      )
    order by o.created_at;
end;
$$;

revoke all on function public.available_rider_orders() from public, anon;
grant execute on function public.available_rider_orders() to authenticated;