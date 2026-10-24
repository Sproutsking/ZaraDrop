create table public.order_rider_locations (
  order_id uuid primary key references public.orders(id) on delete cascade,
  rider_id uuid not null references public.profiles(id) on delete cascade,
  longitude double precision not null check (longitude between -180 and 180),
  latitude double precision not null check (latitude between -90 and 90),
  updated_at timestamptz not null default now()
);

alter table public.order_rider_locations enable row level security;

create policy order_rider_locations_read_participants on public.order_rider_locations
  for select to authenticated using (
    public.can_access_order(order_id) and exists (
      select 1 from public.orders as o
      where o.id = order_id and o.status = 'on_the_way'
    )
  );

grant select on public.order_rider_locations to authenticated;
revoke insert, update, delete on public.order_rider_locations from anon, authenticated;

create or replace function public.update_order_rider_location(
  p_order_id uuid,
  p_longitude double precision,
  p_latitude double precision
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.current_app_role() <> 'rider'::public.app_role then
    raise exception 'Rider sign-in required';
  end if;
  if p_longitude not between -180 and 180 or p_latitude not between -90 and 90 then
    raise exception 'Invalid coordinates';
  end if;
  if not exists (
    select 1 from public.orders
    where id = p_order_id and rider_id = auth.uid() and status = 'on_the_way'
  ) then raise exception 'Active rider assignment not found'; end if;

  insert into public.order_rider_locations (order_id, rider_id, longitude, latitude, updated_at)
  values (p_order_id, auth.uid(), p_longitude, p_latitude, now())
  on conflict (order_id) do update set
    rider_id = excluded.rider_id,
    longitude = excluded.longitude,
    latitude = excluded.latitude,
    updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.update_order_rider_location(uuid, double precision, double precision) from public;
grant execute on function public.update_order_rider_location(uuid, double precision, double precision) to authenticated;

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
  if p_status = 'delivered' then
    delete from public.order_rider_locations where order_id = p_order_id;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'order_rider_locations'
  ) then alter publication supabase_realtime add table public.order_rider_locations; end if;
end
$$;