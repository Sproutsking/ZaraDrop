create or replace function public.ensure_current_profile()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.profiles (id, display_name)
  select
    v_user_id,
    coalesce(
      nullif(u.raw_user_meta_data ->> 'display_name', ''),
      split_part(coalesce(u.email, ''), '@', 1)
    )
  from auth.users as u
  where u.id = v_user_id
  on conflict (id) do nothing;

  select * into v_profile
  from public.profiles
  where id = v_user_id;

  if not found then
    raise exception 'Could not create a profile for the authenticated user';
  end if;

  return jsonb_build_object(
    'id', v_profile.id,
    'role', v_profile.role,
    'display_name', v_profile.display_name
  );
end;
$$;

revoke all on function public.ensure_current_profile() from public, anon;
grant execute on function public.ensure_current_profile() to authenticated;

insert into public.profiles (id, display_name)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'display_name', ''),
    split_part(coalesce(u.email, ''), '@', 1)
  )
from auth.users as u
on conflict (id) do nothing;