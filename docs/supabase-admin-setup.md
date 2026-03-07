# Crear perfil administrador en Supabase

Este proyecto soporta **dos esquemas** para identificar administradores:

- **Esquema A (legacy):** tabla `profiles` con columna `role`.
- **Esquema B (tu base actual):** tablas `admin_users` + `roles`.

Primero debes crear el usuario en Supabase Auth y luego asignarle permisos admin en el esquema que uses.

## 1) Crear el usuario en Authentication

1. En Supabase Dashboard entra a **Authentication > Users**.
2. Click en **Add user**.
3. Completa email y password (ejemplo `admin@tu-dominio.com`).
4. Guarda.

## 2) Asignar permisos admin

### Opción A — si usas `profiles(role)`

```sql
update profiles
set role = 'admin',
    updated_at = now()
where email = 'admin@tu-dominio.com';
```

### Opción B — si usas `admin_users` + `roles` (según tu esquema)

```sql
-- 1) Asegura que exista el rol admin
insert into roles (role_name, description)
values ('admin', 'Administrador del panel')
on conflict (role_name) do nothing;

-- 2) Asigna el usuario como admin
insert into admin_users (user_id, role_id, branch_id)
select u.id, r.id, null
from auth.users u
join roles r on r.role_name = 'admin'
where u.email = 'admin@tu-dominio.com'
on conflict (user_id)
do update set role_id = excluded.role_id,
              branch_id = excluded.branch_id;
```

> Si quieres limitar el admin a una sola sucursal, en vez de `null` usa el UUID de `branches.id` en `branch_id`.

## 3) Verificar permisos

### Verificación para esquema A (`profiles`)

```sql
select id, email, role, branch_id, created_at
from profiles
where email = 'admin@tu-dominio.com';
```

### Verificación para esquema B (`admin_users` + `roles`)

```sql
select u.email, r.role_name, au.branch_id, au.created_at
from admin_users au
join auth.users u on u.id = au.user_id
join roles r on r.id = au.role_id
where u.email = 'admin@tu-dominio.com';
```

Debe verse `role_name = admin` (o `role = admin` en el esquema A).

## 4) Variables necesarias en el frontend admin

En `web-admin/.env` define:

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
VITE_ENABLE_DEV_BYPASS=false
```

Luego inicia la app web-admin normalmente.
