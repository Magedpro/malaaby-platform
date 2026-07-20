-- ════════════════════════════════════════════════════════════════════════════
-- Malaaby — Supabase Postgres schema
-- Run this once in the Supabase SQL Editor (or via the CLI).
--
-- Design: hybrid. Each entity has real, indexed columns ONLY for fields used in
-- WHERE / ORDER BY / uniqueness, plus a single `data jsonb` column holding the
-- complete typed object exactly as defined in src/lib/types.ts (camelCase).
-- Reads return `data` verbatim (no field mapping). Writes set the indexed
-- columns + data. All access is via the service-role key, which bypasses RLS.
-- ════════════════════════════════════════════════════════════════════════════

-- ── users ───────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id         text primary key,
  email      text not null,
  role       text not null,
  data       jsonb not null,
  created_at timestamptz not null default now()
);
-- findByEmail is case-insensitive → unique index on lower(email)
create unique index if not exists users_email_lower_idx on public.users (lower(email));
create index if not exists users_role_idx on public.users (role);

-- ── stadiums ─────────────────────────────────────────────────────────────────
create table if not exists public.stadiums (
  slug       text primary key,
  owner_id   text not null,
  data       jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists stadiums_owner_idx on public.stadiums (owner_id);

-- ── fields ───────────────────────────────────────────────────────────────────
create table if not exists public.fields (
  id           text primary key,
  stadium_slug text not null,
  data         jsonb not null,
  created_at   timestamptz not null default now()
);
create index if not exists fields_stadium_idx on public.fields (stadium_slug);

-- ── bookings (hot path: conflict detection + slot generation) ────────────────
create table if not exists public.bookings (
  id           text primary key,
  field_id     text not null,
  stadium_slug text not null,
  date         text not null,
  start_time   text not null,
  end_time     text not null,
  status       text not null,
  data         jsonb not null,
  created_at   timestamptz not null default now()
);
create index if not exists bookings_field_date_status_idx on public.bookings (field_id, date, status);
create index if not exists bookings_stadium_created_idx on public.bookings (stadium_slug, created_at desc);
-- Double-booking hardening: two concurrent requests can both pass hasConflict.
-- Slots are on a fixed per-field grid, so identical (field_id, date, start_time)
-- is the real collision. A unique-violation on insert is treated as the 409.
create unique index if not exists bookings_no_double_active
  on public.bookings (field_id, date, start_time)
  where status in ('pending', 'confirmed');

-- ── subscription_plans ───────────────────────────────────────────────────────
create table if not exists public.subscription_plans (
  id         text primary key,
  data       jsonb not null,
  created_at timestamptz not null default now()
);

-- ── notifications ────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id           text primary key,
  stadium_slug text not null,
  is_read      boolean not null default false,
  data         jsonb not null,
  created_at   timestamptz not null default now()
);
create index if not exists notifications_stadium_created_idx on public.notifications (stadium_slug, created_at desc);
create index if not exists notifications_stadium_unread_idx on public.notifications (stadium_slug) where is_read = false;

-- ── support_tickets (data includes replies[]) ────────────────────────────────
create table if not exists public.support_tickets (
  id           text primary key,
  stadium_slug text not null,
  data         jsonb not null,
  created_at   timestamptz not null default now()
);
create index if not exists tickets_stadium_idx on public.support_tickets (stadium_slug);
create index if not exists tickets_created_idx on public.support_tickets (created_at desc);

-- ── activity_logs ────────────────────────────────────────────────────────────
create table if not exists public.activity_logs (
  id         text primary key,
  data       jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists logs_created_idx on public.activity_logs (created_at desc);

-- ── cities ───────────────────────────────────────────────────────────────────
create table if not exists public.cities (
  id         text primary key,
  is_active  boolean not null default true,
  data       jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists cities_active_idx on public.cities (is_active);

-- ── platform_settings (singleton, id = 1) ────────────────────────────────────
create table if not exists public.platform_settings (
  id   int primary key default 1,
  data jsonb not null,
  constraint platform_settings_singleton check (id = 1)
);
