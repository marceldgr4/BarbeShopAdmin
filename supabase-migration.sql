-- ─────────────────────────────────────────────────────────────────────────────
-- BarberShop Admin — Supabase PostgreSQL Migration
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";  -- for text search

-- ── Profiles ──────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users

create type user_role as enum ('admin', 'barber', 'client');

create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text not null,
  email           text unique not null,
  phone           text,
  avatar_url      text,
  role            user_role not null default 'client',
  branch_id   uuid,    -- FK added after branches table
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Barbershops ───────────────────────────────────────────────────────────────

create table branches (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  address         text not null,
  phone           text not null,
  email           text,
  latitude        numeric(9,6),
  longitude       numeric(9,6),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Add FK from profiles to branches
alter table profiles
  add constraint fk_profile_barbershop
  foreign key (branch_id) references branches(id) on delete set null;

-- Indexes for geosearch and text search
create index idx_branches_is_active on branches(is_active);
create index idx_branches_location on branches(latitude, longitude);
create index idx_branches_name_trgm on branches using gin(name gin_trgm_ops);

-- ── Barbers ───────────────────────────────────────────────────────────────────

create table barbers (
  id              uuid primary key default uuid_generate_v4(),
  branch_id       uuid not null references branches(id) on delete cascade,
  name            text not null,
  bio             text,
  specialty_id    uuid,
  photo_url       text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_barbers_barbershop on barbers(branch_id);
create index idx_barbers_is_active on barbers(is_active);

-- ── Services ──────────────────────────────────────────────────────────────────

create table service_categories (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  description       text,
  duration_minutes  integer not null check (duration_minutes > 0),
  price             numeric(10,2) not null check (price >= 0),
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_service_categories_is_active on service_categories(is_active);
create index idx_service_categories_name_trgm on service_categories using gin(name gin_trgm_ops);

-- ── Barber Schedules ──────────────────────────────────────────────────────────

create table barber_schedules (
  id              uuid primary key default uuid_generate_v4(),
  barber_id       uuid not null references barbers(id) on delete cascade,
  branch_id   uuid not null references branches(id) on delete cascade,
  weekday         smallint not null check (weekday between 0 and 6),  -- 0=Sun
  start_time      time not null,
  end_time        time not null,
  is_working      boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (barber_id, weekday)
);

create index idx_schedules_barber on barber_schedules(barber_id);

-- ── Barber Break Times ────────────────────────────────────────────────────────

create table barber_break_times (
  id          uuid primary key default uuid_generate_v4(),
  barber_id   uuid not null references barbers(id) on delete cascade,
  weekday     smallint not null check (weekday between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  label       text,
  constraint no_overlap_break check (start_time < end_time)
);

create index idx_breaks_barber on barber_break_times(barber_id, weekday);

-- ── Barber Days Off ───────────────────────────────────────────────────────────

create table barber_days_off (
  id          uuid primary key default uuid_generate_v4(),
  barber_id   uuid not null references barbers(id) on delete cascade,
  date        date not null,
  reason      text,
  created_at  timestamptz not null default now(),
  unique (barber_id, date)
);

create index idx_days_off_barber_date on barber_days_off(barber_id, date);

-- ── Appointments ──────────────────────────────────────────────────────────────

create type appointment_status as enum (
  'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
);

create table appointments (
  id                    uuid primary key default uuid_generate_v4(),
  client_id             uuid not null references profiles(id),
  barber_id             uuid not null references barbers(id),
  branch_id         uuid not null references branches(id),
  service_id            uuid not null references service_categories(id),
  scheduled_at          timestamptz not null,
  duration_minutes      integer not null,
  status                appointment_status not null default 'pending',
  notes                 text,
  cancellation_reason   text,
  cancelled_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Critical index for double-booking prevention (RF10, RNF04)
create unique index idx_appointments_no_double_book
  on appointments (barber_id, scheduled_at)
  where status not in ('cancelled', 'no_show');

create index idx_appointments_barber_date  on appointments(barber_id, scheduled_at);
create index idx_appointments_barbershop   on appointments(branch_id, scheduled_at);
create index idx_appointments_client       on appointments(client_id, scheduled_at);
create index idx_appointments_status       on appointments(status);

-- ── Reviews ───────────────────────────────────────────────────────────────────

create table reviews (
  id              uuid primary key default uuid_generate_v4(),
  appointment_id  uuid references appointments(id) on delete cascade,
  client_id       uuid not null references profiles(id),
  barber_id       uuid not null references barbers(id),
  branch_id   uuid not null references branches(id),
  rating          smallint not null check (rating between 1 and 5),
  comment         text,
  is_visible      boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (appointment_id)  -- one review per appointment
);

-- Auto-update barber rating when a review is inserted/updated/deleted
create or replace function update_barber_rating()
returns trigger language plpgsql as $$
begin
  update barbers
  set
    rating       = (select round(avg(rating)::numeric, 2) from reviews where barber_id = coalesce(new.barber_id, old.barber_id) and is_visible = true),
    review_count = (select count(*) from reviews where barber_id = coalesce(new.barber_id, old.barber_id) and is_visible = true),
    updated_at   = now()
  where id = coalesce(new.barber_id, old.barber_id);
  return new;
end;
$$;

create trigger trg_update_barber_rating
  after insert or update or delete on reviews
  for each row execute function update_barber_rating();

-- ── Audit Logs (RF24) ─────────────────────────────────────────────────────────

create table audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id),
  action      text not null,  -- 'create' | 'update' | 'delete' | 'status_change'
  resource    text not null,  -- table name
  resource_id text not null,
  old_value   jsonb,
  new_value   jsonb,
  ip_address  text,
  created_at  timestamptz not null default now()
);

create index idx_audit_logs_resource on audit_logs(resource, resource_id);
create index idx_audit_logs_user     on audit_logs(user_id);
create index idx_audit_logs_created  on audit_logs(created_at desc);

-- ── Timestamps Trigger ────────────────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply to all tables with updated_at
do $$ declare t text;
begin
  for t in select unnest(array['profiles','branches','barbers','services','barber_schedules','appointments']) loop
    execute format('
      create trigger trg_updated_at_%s
        before update on %s
        for each row execute function update_updated_at();
    ', t, t);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on all tables
alter table profiles         enable row level security;
alter table branches      enable row level security;
alter table barbers          enable row level security;
alter table service_categories         enable row level security;
alter table barber_schedules enable row level security;
alter table barber_break_times enable row level security;
alter table barber_days_off  enable row level security;
alter table appointments     enable row level security;
alter table reviews          enable row level security;
alter table audit_logs       enable row level security;

-- Helper function to get current user role
create or replace function current_user_role()
returns user_role language sql stable security definer as $$
  select role from profiles where id = auth.uid();
$$;

-- ── Barbershops RLS ───────────────────────────────────────────────────────────
-- Anyone can read active branches (mobile app)
create policy "branches_select_public"
  on branches for select
  using (is_active = true);

-- Admins can do everything
create policy "branches_all_admin"
  on branches for all
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- ── Barbers RLS ───────────────────────────────────────────────────────────────
create policy "barbers_select_public"
  on barbers for select
  using (is_active = true);

create policy "barbers_all_admin"
  on barbers for all
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- Barbers can update their own profile
create policy "barbers_update_own"
  on barbers for update
  using (user_id = auth.uid());

-- ── Services RLS ──────────────────────────────────────────────────────────────
create policy "services_select_public"
  on services for select
  using (is_active = true);

create policy "service_categories_all_admin"
  on services for all
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- ── Appointments RLS ──────────────────────────────────────────────────────────
-- Clients see only their own appointments
create policy "appointments_select_client"
  on appointments for select
  using (client_id = auth.uid());

-- Barbers see appointments assigned to them
create policy "appointments_select_barber"
  on appointments for select
  using (
    barber_id in (select id from barbers where user_id = auth.uid())
  );

-- Admins see everything
create policy "appointments_all_admin"
  on appointments for all
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- Clients can create and cancel their own appointments
create policy "appointments_insert_client"
  on appointments for insert
  with check (client_id = auth.uid() and current_user_role() = 'client');

create policy "appointments_update_client"
  on appointments for update
  using (client_id = auth.uid() and status in ('pending', 'confirmed'));

-- ── Profiles RLS ─────────────────────────────────────────────────────────────
create policy "profiles_select_own"
  on profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on profiles for update
  using (id = auth.uid());

create policy "profiles_all_admin"
  on profiles for all
  using (current_user_role() = 'admin');

-- ── Audit Logs RLS ────────────────────────────────────────────────────────────
-- Only admins can read audit logs
create policy "audit_logs_select_admin"
  on audit_logs for select
  using (current_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC FUNCTIONS (used by Dashboard service)
-- ─────────────────────────────────────────────────────────────────────────────

-- Top services by appointment count
create or replace function get_top_service_categories(
  p_branch_id uuid,
  p_month_start   timestamptz,
  p_limit         integer default 5
)
returns table(service_id uuid, service_name text, count bigint)
language sql stable as $$
  select
    s.id,
    s.name,
    count(a.id)
  from appointments a
  join service_categories s on s.id = a.service_id
  where a.status in ('completed', 'confirmed')
    and a.scheduled_at >= p_month_start
    and (p_branch_id is null or a.branch_id = p_branch_id)
  group by s.id, s.name
  order by count(a.id) desc
  limit p_limit;
$$;

-- Top barbers by appointment count + avg rating
create or replace function get_top_barbers(
  p_branch_id uuid,
  p_month_start   timestamptz,
  p_limit         integer default 5
)
returns table(barber_id uuid, name text, appointment_count bigint, avg_rating numeric)
language sql stable as $$
  select
    b.id,
    b.name,
    count(a.id),
    b.rating
  from appointments a
  join barbers b on b.id = a.barber_id
  where a.status in ('completed', 'confirmed')
    and a.scheduled_at >= p_month_start
    and (p_branch_id is null or a.branch_id = p_branch_id)
  group by b.id, b.name, b.rating
  order by count(a.id) desc
  limit p_limit;
$$;
