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
  if not exists (
    select 1 from public.profiles where id = p_rider_id and role = 'rider'
  ) then
    raise exception 'Invalid rider';
  end if;
  update public.orders set rider_id = p_rider_id, updated_at = now()
    where id = p_order_id and status in ('placed', 'preparing', 'ready', 'on_the_way');
  if not found then raise exception 'Active order not found'; end if;
end;
$$;