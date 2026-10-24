alter table public.orders
  add column payment_method text not null default 'cash_on_delivery'
    check (payment_method in ('cash_on_delivery', 'paystack')),
  add column payment_status text not null default 'not_required'
    check (payment_status in ('not_required', 'pending', 'paid', 'failed'));

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  provider text not null check (provider = 'paystack'),
  reference text not null unique,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null,
  customer_email text not null,
  authorization_url text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_order_created_idx on public.payments (order_id, created_at desc);
alter table public.payments enable row level security;
create policy payments_read_customer_or_ops on public.payments
  for select to authenticated using (
    public.is_ops() or exists (
      select 1 from public.orders as o
      where o.id = order_id and o.customer_id = (select auth.uid())
    )
  );
grant select on public.payments to authenticated;
revoke insert, update, delete on public.payments from anon, authenticated;

create or replace function public.can_access_order(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_ops() or exists (
    select 1 from public.orders as o
    left join public.vendors as v on v.id = o.vendor_id
    where o.id = p_order_id
      and (
        o.customer_id = (select auth.uid()) or
        (
          (o.rider_id = (select auth.uid()) or v.owner_id = (select auth.uid())) and
          (o.payment_method = 'cash_on_delivery' or o.payment_status = 'paid')
        )
      )
  )
$$;

drop policy orders_read_participants on public.orders;
create policy orders_read_participants on public.orders
  for select to authenticated using (
    customer_id = (select auth.uid()) or public.is_ops() or
    (
      (rider_id = (select auth.uid()) or exists (
        select 1 from public.vendors as v
        where v.id = vendor_id and v.owner_id = (select auth.uid())
      )) and (payment_method = 'cash_on_delivery' or payment_status = 'paid')
    )
  );

drop function public.place_order(uuid, text, jsonb, text);

create function public.place_order(
  p_vendor_id uuid,
  p_delivery_address text,
  p_items jsonb,
  p_note text,
  p_payment_method text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_vendor public.vendors%rowtype;
  v_order_id uuid;
  v_subtotal numeric(12, 2);
  v_item jsonb;
  v_menu_item public.menu_items%rowtype;
  v_quantity integer;
begin
  if v_user_id is null or public.current_app_role() <> 'customer'::public.app_role then
    raise exception 'Customer sign-in required';
  end if;
  if p_payment_method not in ('cash_on_delivery', 'paystack') then
    raise exception 'Unsupported payment method';
  end if;
  if nullif(trim(p_delivery_address), '') is null then
    raise exception 'Delivery address is required';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one menu item is required';
  end if;

  select * into v_vendor from public.vendors where id = p_vendor_id and is_active;
  if not found then raise exception 'Vendor is not available'; end if;

  v_subtotal := 0;
  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity < 1 or v_quantity > 50 then raise exception 'Invalid item quantity'; end if;
    select * into v_menu_item
      from public.menu_items
      where id = (v_item ->> 'menu_item_id')::uuid
        and vendor_id = p_vendor_id
        and is_available;
    if not found then raise exception 'A selected menu item is unavailable'; end if;
    v_subtotal := v_subtotal + (v_menu_item.price * v_quantity);
  end loop;

  insert into public.orders (
    customer_id, vendor_id, status, delivery_address, customer_note,
    currency, subtotal, delivery_fee, total, eta_minutes, payment_method, payment_status
  ) values (
    v_user_id, p_vendor_id, 'placed', trim(p_delivery_address), coalesce(p_note, ''),
    v_vendor.currency, v_subtotal, v_vendor.delivery_fee,
    v_subtotal + v_vendor.delivery_fee, v_vendor.prep_minutes + 15,
    p_payment_method, case when p_payment_method = 'paystack' then 'pending' else 'not_required' end
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    select * into v_menu_item from public.menu_items where id = (v_item ->> 'menu_item_id')::uuid;
    insert into public.order_items (order_id, menu_item_id, item_name, unit_price, quantity)
    values (v_order_id, v_menu_item.id, v_menu_item.name, v_menu_item.price, v_quantity);
  end loop;

  return v_order_id;
end;
$$;

revoke all on function public.place_order(uuid, text, jsonb, text, text) from public;
grant execute on function public.place_order(uuid, text, jsonb, text, text) to authenticated;

create or replace function public.confirm_paystack_payment(p_reference text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_order_payment_status text;
  v_payment_status text;
begin
  select p.order_id, p.status, o.payment_status
    into v_order_id, v_payment_status, v_order_payment_status
    from public.payments as p
    join public.orders as o on o.id = p.order_id
    where p.reference = p_reference and p.provider = 'paystack'
    for update of p, o;
  if not found then raise exception 'Payment reference not found'; end if;
  if v_payment_status = 'paid' and v_order_payment_status = 'paid' then
    return v_order_id;
  end if;
  if v_payment_status <> 'pending' or v_order_payment_status <> 'pending' then
    raise exception 'Payment is not pending';
  end if;
  update public.payments set status = 'paid', updated_at = now()
    where reference = p_reference;
  update public.orders set payment_status = 'paid', updated_at = now()
    where id = v_order_id and payment_method = 'paystack';
  if not found then raise exception 'Online payment order not found'; end if;
  return v_order_id;
end;
$$;

revoke all on function public.confirm_paystack_payment(text) from public, anon, authenticated;
grant execute on function public.confirm_paystack_payment(text) to service_role;

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
    select o.id, o.order_number, o.vendor_id, v.name, v.emoji, v.pickup_address,
      o.delivery_address, o.customer_note, o.currency, o.delivery_fee, o.total,
      o.eta_minutes, o.created_at,
      coalesce((select jsonb_agg(jsonb_build_object(
        'item_name', oi.item_name, 'quantity', oi.quantity, 'unit_price', oi.unit_price
      ) order by oi.created_at) from public.order_items as oi where oi.order_id = o.id), '[]'::jsonb)
    from public.orders as o
    join public.vendors as v on v.id = o.vendor_id
    where o.rider_id is null and o.status in ('placed', 'preparing', 'ready')
      and (o.payment_method = 'cash_on_delivery' or o.payment_status = 'paid')
    order by o.created_at;
end;
$$;

create or replace function public.claim_order(p_order_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
begin
  if auth.uid() is null or public.current_app_role() <> 'rider'::public.app_role then
    raise exception 'Rider sign-in required';
  end if;
  update public.orders set rider_id = auth.uid(), updated_at = now()
    where id = p_order_id and rider_id is null and status in ('placed', 'preparing', 'ready')
      and (payment_method = 'cash_on_delivery' or payment_status = 'paid')
    returning id into v_order_id;
  if v_order_id is null then raise exception 'Order is no longer available'; end if;
  return v_order_id;
end;
$$;

create or replace function public.set_vendor_order_status(p_order_id uuid, p_status public.order_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_vendor_id uuid;
  v_current_status public.order_status;
  v_payment_method text;
  v_payment_status text;
begin
  if auth.uid() is null or public.current_app_role() <> 'vendor'::public.app_role then
    raise exception 'Vendor sign-in required';
  end if;
  select o.vendor_id, o.status, o.payment_method, o.payment_status
    into v_vendor_id, v_current_status, v_payment_method, v_payment_status
    from public.orders as o where o.id = p_order_id for update;
  if not found or not exists (
    select 1 from public.vendors as v where v.id = v_vendor_id and v.owner_id = auth.uid()
  ) then raise exception 'Order not found'; end if;
  if v_payment_method = 'paystack' and v_payment_status <> 'paid' then
    raise exception 'Online payment has not been confirmed';
  end if;
  if not (
    (v_current_status = 'placed' and p_status in ('preparing', 'cancelled')) or
    (v_current_status = 'preparing' and p_status in ('ready', 'cancelled'))
  ) then raise exception 'Invalid vendor order status transition'; end if;
  update public.orders set status = p_status, updated_at = now() where id = p_order_id;
end;
$$;

create or replace function public.assign_order(p_order_id uuid, p_rider_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.current_app_role() <> 'ops'::public.app_role then
    raise exception 'Operations sign-in required';
  end if;
  if not exists (select 1 from public.profiles where id = p_rider_id and role = 'rider') then
    raise exception 'Invalid rider';
  end if;
  update public.orders set rider_id = p_rider_id, updated_at = now()
    where id = p_order_id and status in ('placed', 'preparing', 'ready', 'on_the_way')
      and (payment_method = 'cash_on_delivery' or payment_status = 'paid');
  if not found then raise exception 'Active paid order not found'; end if;
end;
$$;