-- Página de Facebook por defecto para crear anuncios
alter table public.dashboard_settings
  add column if not exists meta_page_id text not null default '';
