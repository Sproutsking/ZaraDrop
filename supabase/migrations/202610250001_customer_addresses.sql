create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 60),
  address text not null check (char_length(trim(address)) between 5 and 500),
  country_code text not null default 'NG' check (country_code in ('NG', 'GH', 'KE', 'ZA')),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index customer_addresses_one_default_per_user
  on public.customer_addresses(user_id) where is_default;
create index customer_addresses_user_created_idx
  on public.customer_addresses(user_id, created_at desc);

alter table public.customer_addresses enable row level security;

create policy customer_addresses_read_self on public.customer_addresses
  for select to authenticated using (user_id = (select auth.uid()));
create policy customer_addresses_insert_self on public.customer_addresses
  for insert to authenticated with check (
    user_id = (select auth.uid()) and public.current_app_role() = 'customer'::public.app_role
  );
create policy customer_addresses_update_self on public.customer_addresses
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy customer_addresses_delete_self on public.customer_addresses
  for delete to authenticated using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.customer_addresses to authenticated;

create or replace function public.save_customer_address(
  p_label text,
  p_address text,
  p_country_code text default 'NG',
  p_make_default boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_address_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if public.current_app_role() <> 'customer'::public.app_role then
    raise exception 'Customer role required';
  end if;
  if char_length(trim(coalesce(p_label, ''))) not between 1 and 60 then
    raise exception 'Address label must be between 1 and 60 characters';
  end if;
  if char_length(trim(coalesce(p_address, ''))) not between 5 and 500 then
    raise exception 'Address must be between 5 and 500 characters';
  end if;
  if p_country_code not in ('NG', 'GH', 'KE', 'ZA') then
    raise exception 'Unsupported country code';
  end if;

  if p_make_default or not exists (
    select 1 from public.customer_addresses where user_id = v_user_id and is_default
  ) then
    update public.customer_addresses set is_default = false where user_id = v_user_id and is_default;
    p_make_default := true;
  end if;

  insert into public.customer_addresses(user_id, label, address, country_code, is_default)
  values (v_user_id, trim(p_label), trim(p_address), p_country_code, p_make_default)
  returning id into v_address_id;

  return v_address_id;
end;
$$;

create or replace function public.set_default_customer_address(p_address_id uuid)
returns void
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
  if public.current_app_role() <> 'customer'::public.app_role then
    raise exception 'Customer role required';
  end if;
  if not exists (
    select 1 from public.customer_addresses where id = p_address_id and user_id = v_user_id
  ) then
    raise exception 'Address not found';
  end if;

  update public.customer_addresses set is_default = false where user_id = v_user_id;
  update public.customer_addresses set is_default = true where id = p_address_id and user_id = v_user_id;
end;
$$;

revoke all on function public.save_customer_address(text, text, text, boolean) from public, anon;
revoke all on function public.set_default_customer_address(uuid) from public, anon;
grant execute on function public.save_customer_address(text, text, text, boolean) to authenticated;
grant execute on function public.set_default_customer_address(uuid) to authenticated;