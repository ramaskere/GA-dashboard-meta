-- Clientes del dashboard (branding). Ejecutá en Supabase SQL Editor.
-- Los tokens de Meta siguen en dashboard_settings (una fila por client_slug).

create table if not exists public.dashboard_clients (
  id text primary key,
  name text not null,
  tagline text not null default 'Reportes de Meta Ads',
  logo text not null default '/clients/go-apple/logo.svg',
  primary_color text not null default '#0071e3',
  accent_color text not null default '#1d1d1f',
  currency text not null default 'ARS',
  locale text not null default 'es-AR',
  timezone text not null default 'America/Argentina/Buenos_Aires',
  default_countries jsonb not null default '["AR"]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dashboard_clients enable row level security;

comment on table public.dashboard_clients is
  'Branding y config de clientes. Acceso solo vía service role del servidor.';

-- Semilla Go Apple (no pisa si ya existe)
insert into public.dashboard_clients (
  id, name, tagline, logo, primary_color, accent_color, currency, locale, timezone, default_countries
) values (
  'go-apple',
  'Go Apple',
  'Reportes de Meta Ads',
  '/clients/go-apple/logo.svg',
  '#0071e3',
  '#1d1d1f',
  'ARS',
  'es-AR',
  'America/Argentina/Buenos_Aires',
  '["AR"]'::jsonb
) on conflict (id) do nothing;
