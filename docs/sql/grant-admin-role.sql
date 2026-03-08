-- Uso:
-- 1) Abre Supabase -> SQL Editor.
-- 2) Reemplaza el correo en target_email.
-- 3) Ejecuta todo el script.

begin;

do $$
declare
  target_email text := 'admin@tu-dominio.com';
  target_user_id uuid;
begin
  -- Obtiene el usuario creado en Authentication > Users
  select u.id into target_user_id
  from auth.users u
  where u.email = target_email
  limit 1;

  if target_user_id is null then
    raise exception 'No existe usuario en auth.users para el email: %', target_email;
  end if;

  -- Esquema A: profiles.role = 'admin'
  if exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'profiles'
      and c.column_name = 'role'
  ) then
    if exists (
      select 1
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = 'profiles'
        and c.column_name = 'updated_at'
    ) then
      update public.profiles p
      set role = 'admin',
          updated_at = now()
      where p.id = target_user_id
         or lower(p.email) = lower(target_email);
    else
      update public.profiles p
      set role = 'admin'
      where p.id = target_user_id
         or lower(p.email) = lower(target_email);
    end if;
  end if;

  -- Esquema B: admin_users + roles
  if exists (
    select 1
    from information_schema.tables t
    where t.table_schema = 'public'
      and t.table_name = 'roles'
  )
  and exists (
    select 1
    from information_schema.tables t
    where t.table_schema = 'public'
      and t.table_name = 'admin_users'
  ) then
    insert into public.roles (role_name, description)
    values ('admin', 'Administrador del panel')
    on conflict (role_name) do nothing;

    insert into public.admin_users (user_id, role_id, branch_id)
    select target_user_id, r.id, null
    from public.roles r
    where r.role_name = 'admin'
    on conflict (user_id)
    do update set role_id = excluded.role_id,
                  branch_id = excluded.branch_id;
  end if;
end $$;

commit;

-- Verificación rápida
select u.email,
       p.role as profile_role,
       r.role_name as admin_users_role,
       au.branch_id
from auth.users u
left join public.profiles p on p.id = u.id
left join public.admin_users au on au.user_id = u.id
left join public.roles r on r.id = au.role_id
where u.email = 'admin@tu-dominio.com';
