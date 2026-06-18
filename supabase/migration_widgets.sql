-- Agregar configuración de widgets (ejecutá si ya tenés dashboard_settings creada)
alter table public.dashboard_settings
  add column if not exists widget_config jsonb not null default '{}'::jsonb;

comment on column public.dashboard_settings.widget_config is
  'Layout de widgets del dashboard: { "widgets": [{ "id", "enabled", "order" }] }';
