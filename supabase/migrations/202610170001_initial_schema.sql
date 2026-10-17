create type public.app_role as enum ('customer', 'rider', 'vendor', 'ops');
create type public.order_status as enum ('placed', 'preparing', 'ready', 'on_the_way', 'delivered', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'customer',
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete restrict,
  name text not null,
  description text not null default '',
  kind text not null default 'Restaurants',
  category text not null default 'Local',
  emoji text not null default '🍽️',
  country_code text not null default 'NG' check (country_code in ('NG', 'GH', 'KE', 'ZA')),
  currency text not null default 'NGN',
  pickup_address text not null default '',
  delivery_fee numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  prep_minutes integer not null default 30 check (prep_minutes > 0),
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  name text not null,
  description text not null default '',
  category text not null default 'Local',
  emoji text not null default '🍽️',
  price numeric(12, 2) not null check (price >= 0),
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  vendor_id uuid not null references public.vendors(id) on delete restrict,
  rider_id uuid references public.profiles(id) on delete set null,
  status public.order_status not null default 'placed',
  delivery_address text not null,
  customer_note text not null default '',
  currency text not null default 'NGN',
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  delivery_fee numeric(12, 2) not null check (delivery_fee >= 0),
  total numeric(12, 2) not null check (total >= 0),
  eta_minutes integer not null default 30 check (eta_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create table public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index orders_customer_created_idx on public.orders (customer_id, created_at desc);
create index orders_rider_status_idx on public.orders (rider_id, status, created_at desc);
create index orders_vendor_status_idx on public.orders (vendor_id, status, created_at desc);
create index menu_items_vendor_available_idx on public.menu_items (vendor_id, is_available);
create index order_messages_order_created_idx on public.order_messages (order_id, created_at);

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles as p where p.id = (select auth.uid())
$$;

create or replace function public.is_ops()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() = 'ops'::public.app_role, false)
$$;

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_auth_user();

create or replace function public.place_order(
  p_vendor_id uuid,
  p_delivery_address text,
  p_items jsonb,
  p_note text default ''
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
    currency, subtotal, delivery_fee, total, eta_minutes
  ) values (
    v_user_id, p_vendor_id, 'placed', trim(p_delivery_address), coalesce(p_note, ''),
    v_vendor.currency, v_subtotal, v_vendor.delivery_fee,
    v_subtotal + v_vendor.delivery_fee, v_vendor.prep_minutes + 15
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

create or replace function public.available_rider_orders()
returns table (
  id uuid,
  order_number bigint,
  vendor_id uuid,
  vendor_name text,
  vendor_emoji text,
  pickup_address text,
  total numeric,
  eta_minutes integer,
  created_at timestamptz
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
      o.total, o.eta_minutes, o.created_at
    from public.orders as o
    join public.vendors as v on v.id = o.vendor_id
    where o.rider_id is null and o.status in ('placed', 'preparing', 'ready')
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
  update public.orders
    set rider_id = auth.uid(), updated_at = now()
    where id = p_order_id and rider_id is null and status in ('placed', 'preparing', 'ready')
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
begin
  if auth.uid() is null or public.current_app_role() <> 'vendor'::public.app_role then
    raise exception 'Vendor sign-in required';
  end if;
  select o.vendor_id, o.status into v_vendor_id, v_current_status
    from public.orders as o where o.id = p_order_id for update;
  if not found or not exists (
    select 1 from public.vendors as v where v.id = v_vendor_id and v.owner_id = auth.uid()
  ) then raise exception 'Order not found'; end if;
  if not (
    (v_current_status = 'placed' and p_status in ('preparing', 'cancelled')) or
    (v_current_status = 'preparing' and p_status in ('ready', 'cancelled'))
  ) then raise exception 'Invalid vendor order status transition'; end if;
  update public.orders set status = p_status, updated_at = now() where id = p_order_id;
end;
$$;

create or replace function public.set_rider_order_status(p_order_id uuid, p_status public.order_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_status public.order_status;
begin
  if auth.uid() is null or public.current_app_role() <> 'rider'::public.app_role then
    raise exception 'Rider sign-in required';
  end if;
  select o.status into v_current_status from public.orders as o
    where o.id = p_order_id and o.rider_id = auth.uid() for update;
  if not found then raise exception 'Assigned order not found'; end if;
  if not (
    (v_current_status = 'ready' and p_status = 'on_the_way') or
    (v_current_status = 'on_the_way' and p_status = 'delivered')
  ) then raise exception 'Invalid rider order status transition'; end if;
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
  if public.current_app_role() <> 'ops'::public.app_role or not exists (
    select 1 from public.profiles where id = p_rider_id and role = 'rider'
  ) then raise exception 'Invalid rider'; end if;
  update public.orders set rider_id = p_rider_id, updated_at = now()
    where id = p_order_id and status <> 'delivered';
  if not found then raise exception 'Order not found'; end if;
end;
$$;

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
      and (o.customer_id = (select auth.uid()) or o.rider_id = (select auth.uid()) or v.owner_id = (select auth.uid()))
  )
$$;

alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_messages enable row level security;

create policy profiles_read_self_or_ops on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_ops());
create policy profiles_update_self on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;

create policy vendors_read_active_or_owner on public.vendors
  for select to anon, authenticated using (is_active or owner_id = (select auth.uid()) or public.is_ops());
create policy vendors_insert_owner on public.vendors
  for insert to authenticated with check (owner_id = (select auth.uid()) and public.current_app_role() = 'vendor');
create policy vendors_update_owner_or_ops on public.vendors
  for update to authenticated using (owner_id = (select auth.uid()) or public.is_ops())
  with check (owner_id = (select auth.uid()) or public.is_ops());

create policy menu_read_available_or_owner on public.menu_items
  for select to anon, authenticated using (
    (is_available and exists (select 1 from public.vendors v where v.id = vendor_id and v.is_active)) or
    exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_id = (select auth.uid())) or
    public.is_ops()
  );
create policy menu_manage_owner_or_ops on public.menu_items
  for all to authenticated using (
    exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_id = (select auth.uid())) or public.is_ops()
  ) with check (
    exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_id = (select auth.uid())) or public.is_ops()
  );

create policy orders_read_participants on public.orders
  for select to authenticated using (
    customer_id = (select auth.uid()) or rider_id = (select auth.uid()) or public.is_ops() or
    exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_id = (select auth.uid()))
  );
create policy orders_create_customer on public.orders
  for insert to authenticated with check (
    customer_id = (select auth.uid()) and public.current_app_role() = 'customer'
  );
create policy order_items_read_participants on public.order_items
  for select to authenticated using (public.can_access_order(order_id));
create policy order_messages_read_participants on public.order_messages
  for select to authenticated using (public.can_access_order(order_id));
create policy order_messages_send_participants on public.order_messages
  for insert to authenticated with check (
    sender_id = (select auth.uid()) and public.can_access_order(order_id)
  );

revoke all on function public.place_order(uuid, text, jsonb, text) from public;
revoke all on function public.available_rider_orders() from public;
revoke all on function public.claim_order(uuid) from public;
revoke all on function public.set_vendor_order_status(uuid, public.order_status) from public;
revoke all on function public.set_rider_order_status(uuid, public.order_status) from public;
revoke all on function public.assign_order(uuid, uuid) from public;
grant execute on function public.place_order(uuid, text, jsonb, text) to authenticated;
grant execute on function public.available_rider_orders() to authenticated;
grant execute on function public.claim_order(uuid) to authenticated;
grant execute on function public.set_vendor_order_status(uuid, public.order_status) to authenticated;
grant execute on function public.set_rider_order_status(uuid, public.order_status) to authenticated;
grant execute on function public.assign_order(uuid, uuid) to authenticated;
grant execute on function public.can_access_order(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then alter publication supabase_realtime add table public.orders; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'order_messages'
  ) then alter publication supabase_realtime add table public.order_messages; end if;
end
$$;
