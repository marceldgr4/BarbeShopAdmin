# BarberShop Admin Backend

### TypeScript · Node.js · Express · Supabase · Microservicios

---

## Arquitectura

```
                        ┌─────────────────────────────┐
  iOS App / Web Admin   │         API Gateway          │  :3000
                        │   auth · rate-limit · proxy  │
                        └────────────┬────────────────┘
                                     │
          ┌──────────┬───────────────┼──────────────┬──────────┬──────────┐
          ▼          ▼               ▼              ▼          ▼          ▼
    ┌──────────┐ ┌────────┐ ┌──────────────┐ ┌──────────┐ ┌───────┐ ┌──────────────┐
    │Barbershops│ │Barbers │ │  Services    │ │Schedules │ │Dashbrd│ │ Appointments │
    │  :3001   │ │ :3002  │ │   :3003      │ │  :3004   │ │ :3005 │ │    :3006     │
    └──────────┘ └────────┘ └──────────────┘ └──────────┘ └───────┘ └──────────────┘
          │          │               │              │          │          │
          └──────────┴───────────────┴──────────────┴──────────┴──────────┘
                                     │
                            ┌────────▼────────┐
                            │    Supabase      │
                            │  PostgreSQL +    │
                            │  Auth + Storage  │
                            └─────────────────┘
```

## Estructura del Proyecto

```
barbershop-admin/
├── packages/
│   └── shared/             # Tipos, Supabase client, middlewares compartidos
│       └── src/
│           ├── types/      # Interfaces TypeScript del dominio
│           ├── supabase/   # Client (service role + user-scoped)
│           ├── middleware/ # auth.middleware.ts · error.middleware.ts
│           └── utils/      # Response helpers · pagination · audit log
│
├── gateway/                # API Gateway — auth + proxy a microservicios
│
├── services/
│   ├── barbershops/        # CRUD de barberías
│   ├── barbers/            # CRUD de barberos + stats
│   ├── services-svc/       # CRUD de servicios (cortes, etc.)
│   ├── schedules/          # Horarios semanales + breaks + días libres + slots
│   ├── dashboard/          # Métricas, KPIs, reportes
│   └── appointments/       # Gestión de citas + cambio de estado
│
├── supabase-migration.sql  # ⬅ Ejecutar en Supabase SQL Editor
├── docker-compose.yml
└── .env.example
```

---

## Setup Rápido

### 1. Variables de entorno

```bash
cp .env.example .env
# Completa SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y JWT_SECRET
```

### 2. Ejecutar la migración SQL

Abre el **SQL Editor** en tu proyecto de Supabase y ejecuta:

```
supabase-migration.sql
```

Esto crea todas las tablas, índices, RLS y funciones RPC.


### 2.1 Crear usuario administrador en Supabase (obligatorio para login web)

> Guía completa paso a paso: `docs/supabase-admin-setup.md`.



El login del Web Admin usa **Supabase Auth** (email/password).  
Primero crea el usuario en **Authentication > Users**.

Luego asígnale permisos admin según tu esquema:

- Esquema A: `profiles.role = 'admin'`.
- Esquema B: registrar en `admin_users` con rol `admin` en `roles`.

Ejemplo rápido (esquema A):

```sql
update profiles
set role = 'admin'
where email = 'admin@tu-dominio.com';
```

Ejemplo rápido (esquema B):

```sql
insert into roles (role_name, description)
values ('admin', 'Administrador del panel')
on conflict (role_name) do nothing;

insert into admin_users (user_id, role_id, branch_id)
select u.id, r.id, null
from auth.users u
join roles r on r.role_name = 'admin'
where u.email = 'admin@tu-dominio.com'
on conflict (user_id)
do update set role_id = excluded.role_id,
              branch_id = excluded.branch_id;
```

Script recomendado (auto-detecta ambos esquemas): `docs/sql/grant-admin-role.sql`.

### 3. Desarrollo local con Docker

La forma recomendada de trabajar en todo el ecosistema (Frontend y Microservicios Backend) es usando Docker Compose.

```bash
docker-compose up --build
```

Esto levantará:

- **API Gateway** en `http://localhost:3000`
- **Web Admin (Frontend)** en `http://localhost:8080`
- y todos los microservicios subyacentes.

---

## Endpoints del API Gateway

Todas las rutas requieren `Authorization: Bearer <supabase_jwt>` con rol `admin`.

### 🏪 Barbershops — `/api/admin/barbershops`

| Método | Ruta          | Descripción                                         |
| ------ | ------------- | --------------------------------------------------- |
| GET    | `/`           | Listar (paginado, filtros: search, city, is_active) |
| POST   | `/`           | Crear barbería                                      |
| GET    | `/:id`        | Detalle + barberos + servicios                      |
| PUT    | `/:id`        | Actualizar completo                                 |
| PATCH  | `/:id`        | Actualización parcial                               |
| PATCH  | `/:id/toggle` | Activar / desactivar                                |
| DELETE | `/:id`        | Eliminar (bloquea si hay citas activas)             |

### 💈 Barbers — `/api/admin/barbers`

| Método | Ruta          | Descripción                                        |
| ------ | ------------- | -------------------------------------------------- |
| GET    | `/`           | Listar (filtros: barbershop_id, is_active, rating) |
| POST   | `/`           | Crear barbero + asignar rol en profiles            |
| GET    | `/:id`        | Detalle + horarios + reseñas                       |
| PATCH  | `/:id`        | Actualizar datos                                   |
| PATCH  | `/:id/toggle` | Activar / desactivar                               |
| GET    | `/:id/stats`  | Estadísticas (citas, rating, reseñas)              |
| DELETE | `/:id`        | Eliminar (bloquea si hay citas activas)            |

### ✂️ Services — `/api/admin/services`

| Método | Ruta          | Descripción                                               |
| ------ | ------------- | --------------------------------------------------------- |
| GET    | `/`           | Listar (filtros: barbershop_id, min/max price, is_active) |
| POST   | `/`           | Crear servicio                                            |
| GET    | `/:id`        | Detalle                                                   |
| PATCH  | `/:id`        | Actualizar                                                |
| PATCH  | `/:id/toggle` | Activar / desactivar                                      |
| DELETE | `/:id`        | Eliminar                                                  |

### 📅 Schedules — `/api/admin/schedules`

| Método | Ruta                                            | Descripción                      |
| ------ | ----------------------------------------------- | -------------------------------- |
| GET    | `/`                                             | Horarios por barbero/barbería    |
| POST   | `/`                                             | Crear horario para un día        |
| PATCH  | `/:id`                                          | Actualizar horario               |
| POST   | `/bulk`                                         | Guardar semana completa (7 días) |
| GET    | `/availability?barber_id&date&service_duration` | Slots disponibles                |
| GET    | `/breaks/:barber_id`                            | Breaks del barbero               |
| POST   | `/breaks`                                       | Crear break                      |
| DELETE | `/breaks/:id`                                   | Eliminar break                   |
| GET    | `/days-off/:barber_id`                          | Días libres futuros              |
| POST   | `/days-off`                                     | Crear día libre                  |
| DELETE | `/days-off/:id`                                 | Eliminar día libre               |

### 📊 Dashboard — `/api/admin/dashboard`

| Método | Ruta                                   | Descripción                                               |
| ------ | -------------------------------------- | --------------------------------------------------------- |
| GET    | `/`                                    | KPIs: totales, tasa de completado, top barberos/servicios |
| GET    | `/appointments/by-day?days=30`         | Serie temporal para gráficas                              |
| GET    | `/barbers/occupancy?date_from&date_to` | Ocupación por barbero                                     |
| GET    | `/revenue?month=2026-02`               | Ingresos estimados del mes                                |

### 📋 Appointments — `/api/admin/appointments`

| Método | Ruta          | Descripción                                              |
| ------ | ------------- | -------------------------------------------------------- |
| GET    | `/`           | Listar con filtros completos (fecha, barbero, estado...) |
| GET    | `/today`      | Agenda del día                                           |
| GET    | `/:id`        | Detalle completo                                         |
| PATCH  | `/:id/status` | Cambiar estado (valida transiciones)                     |

---

## Seguridad

- **JWT**: Todos los endpoints validan el token Supabase vía `authenticate` middleware.
- **Roles**: `requireRole('admin')` en el gateway — solo admins acceden.
- **RLS**: Todas las tablas tienen Row Level Security. El backend usa `service_role` key para saltarlas intencionalmente solo en el servidor.
- **Audit Log**: Todas las operaciones CUD se registran en `audit_logs` (RF24).
- **Anti double-booking**: Índice único en `(barber_id, scheduled_at)` excluye citas canceladas (RNF04).

---

## Diagrama de Transiciones de Citas

```
pending ──→ confirmed ──→ in_progress ──→ completed
   │              │              │
   └──────────────┴──────────────┴──→ cancelled
              confirmed ──→ no_show
```

# BarbeShopAdmin
