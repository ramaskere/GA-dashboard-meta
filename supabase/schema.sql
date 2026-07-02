-- Meta Ads Dashboard — ejecutá en Supabase SQL Editor
-- Un proyecto Supabase puede servir todos tus clientes (una fila por client_slug).

create table if not exists public.dashboard_settings (
  client_slug text primary key,
  meta_access_token text not null default '',
  meta_ad_account_id text not null default '',
  meta_page_id text not null default '',
  dashboard_password text,
  widget_config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.dashboard_settings enable row level security;

-- Sin políticas públicas: solo el service role (servidor) accede a los tokens.
comment on table public.dashboard_settings is
  'Credenciales Meta Ads por cliente. Acceso solo vía API del servidor con service role.';
