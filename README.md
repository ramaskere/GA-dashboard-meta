# Meta Ads Dashboard

Dashboard replicable de reportes de Meta Ads. **Go Apple** es el ejemplo incluido.

## ¿Necesito Supabase?

| Qué querés | ¿Supabase? |
|------------|------------|
| Configurar token y Ad Account **desde la web** (`/settings`) | **Sí** |
| Solo variables de entorno en Vercel | No (opcional) |

Un solo proyecto Supabase puede guardar la config de **todos tus clientes** (una fila por `client_slug`).

## Setup rápido

### 1. Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com)
2. **SQL Editor** → ejecutá `supabase/schema.sql`
3. Copiá de **Project Settings → API**:
   - `SUPABASE_URL`
   - `service_role` key (secreta, solo servidor)

### 2. Vercel — variables de entorno

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `CLIENT_ID` | Sí | `go-apple` |
| `SUPABASE_URL` | Para /settings | URL del proyecto |
| `SUPABASE_SERVICE_ROLE_KEY` | Para /settings | Service role key |
| `ADMIN_PASSWORD` | Sí | Contraseña para entrar a `/settings` |
| `META_ACCESS_TOKEN` | Opcional | Fallback si no usás la web |
| `META_AD_ACCOUNT_ID` | Opcional | Fallback si no usás la web |
| `DASHBOARD_PASSWORD` | Opcional | Proteger vista del cliente |

### 3. Configurar Meta desde la web

1. Abrí `https://tu-app.vercel.app/settings`
2. Ingresá `ADMIN_PASSWORD`
3. Pegá el **token de Meta** y el **Ad Account ID**
4. Guardá → el dashboard en `/` ya muestra los datos

## Replicar para otro cliente

1. Copiá `clients/go-apple.json` → `clients/nuevo-cliente.json`
2. Registrá en `src/lib/clients.ts`
3. Nuevo deploy en Vercel con `CLIENT_ID=nuevo-cliente`
4. Misma Supabase: se crea sola la fila al guardar en `/settings`

## Desarrollo local

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Estructura

```
├── clients/              # Branding por cliente
├── supabase/schema.sql   # Tabla dashboard_settings
├── src/app/settings/     # Configuración web de la API
└── src/app/api/          # Meta API (token solo en servidor)
```

Repo: [github.com/ramaskere/GA-dashboard-meta](https://github.com/ramaskere/GA-dashboard-meta)
