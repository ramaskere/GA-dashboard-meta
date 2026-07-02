# SOP — Configurar un cliente nuevo en el Dashboard Meta Ads

> **Para el equipo** · Guía paso a paso para conectar la API de Meta, Supabase y agregar clientes.  
> **Versión:** 1.0 · **Proyecto:** GA Dashboard Meta  
> **PDF:** Abrí `public/docs/SOP-configuracion-clientes.html` en el navegador → Imprimir → Guardar como PDF.

---

## Resumen en 30 segundos

1. Creás la app en **Meta for Developers** y obtenés un **token** con permiso `ads_read`.
2. Configurás **Supabase** (una sola vez para todos los clientes).
3. Desplegás en **Vercel** con las variables de entorno.
4. Entrás a **`/settings`**, pegás el token y elegís la cuenta de anuncios.
5. Para un **cliente nuevo**: copiás `clients/go-apple.json`, lo registrás en código y guardás su config en `/settings`.

---

## Qué necesitás antes de empezar

| Requisito | Para qué |
|-----------|----------|
| Cuenta [Meta for Developers](https://developers.facebook.com/) | Crear la app y el token |
| Acceso a la cuenta de anuncios del cliente en Meta | Ver reportes |
| Proyecto [Supabase](https://supabase.com) | Guardar token y config desde la web |
| Proyecto [Vercel](https://vercel.com) (o servidor Node) | Hosting del dashboard |
| Acceso al repo GitHub | Agregar clientes nuevos |

**Importante:** El token y las contraseñas **nunca** se comparten por WhatsApp ni email en texto plano. Solo se cargan en `/settings` o en variables de entorno de Vercel.

---

## Parte A — Meta API (una vez por app / cliente)

### A1. Crear la app en Meta

1. Entrá a [developers.facebook.com](https://developers.facebook.com/) → **Mis apps** → **Crear app**.
2. Tipo: **Otro** → **App de negocio** (o la opción que permita Marketing API).
3. Nombre sugerido: `Dashboard [Nombre Cliente]`.
4. En el panel de la app, agregá el producto **Marketing API**.

### A2. Permisos necesarios

El token debe tener al menos:

- `ads_read` — **obligatorio** para ver reportes en el dashboard.
- `ads_management` — solo si van a usar la sección **Campañas** (crear anuncios por API).

### A3. Obtener el Access Token

**Opción recomendada (cuenta con acceso a la cuenta de anuncios):**

1. [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Seleccioná tu app.
3. **Permisos** → marcá `ads_read` (y `ads_management` si aplica).
4. **Generar token de acceso**.
5. Para producción: convertir a **token de larga duración** (60 días) o usar **System User** si el Business Manager está verificado.

**Formato del token:** empieza con `EAA…`, sin comillas, sin espacios al inicio o final.

### A4. Verificar que el token funciona

En Graph API Explorer probá:

```
GET /me/adaccounts?fields=name,account_id,currency
```

Si devuelve la cuenta del cliente, el token está bien.

### A5. Limitaciones conocidas

| Situación | Qué pasa |
|-----------|----------|
| App en modo **Desarrollo** | Solo usuarios con rol en la app ven datos. Agregá al cliente como **Tester** o pasá la app a Live (requiere BM verificado). |
| BM **no verificado** | Reportes en dashboard ✅ · Crear anuncios por API ❌ (usar Ads Manager). |
| Token vencido | El dashboard deja de cargar datos → renovar en `/settings`. |

---

## Parte B — Supabase (una sola vez)

### B1. Crear proyecto

1. [supabase.com](https://supabase.com) → **New project**.
2. Anotá la **URL** y la **service_role key** (Settings → API).

### B2. Ejecutar el SQL

En **SQL Editor**, ejecutá en este orden:

1. `supabase/schema.sql` (tabla principal)
2. Si la tabla ya existía de antes: `supabase/migration_page_id.sql` y `supabase/migration_widgets.sql`

### B3. Cómo se guarda cada cliente

Una fila por cliente en `dashboard_settings`:

| Campo | Contenido |
|-------|-----------|
| `client_slug` | Igual al `id` del JSON en `clients/` (ej. `go-apple`) |
| `meta_access_token` | Token de Meta |
| `meta_ad_account_id` | ID de cuenta (`act_123…`) |
| `meta_page_id` | Página de Facebook (para anuncios) |
| `dashboard_password` | Contraseña opcional para el cliente |
| `widget_config` | Widgets, metas mensuales, opciones |

**No hace falta crear filas a mano:** se crean solas al guardar en `/settings`.

---

## Parte C — Vercel / variables de entorno

### C1. Variables obligatorias

| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `CLIENT_ID` | `go-apple` | Cliente por defecto del deploy |
| `ADMIN_PASSWORD` | `tu-clave-admin` | Para entrar a `/settings` |
| `SUPABASE_URL` | `https://xxx.supabase.co` | URL del proyecto |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ…` o `sb_secret_…` | Clave **service_role** (secreta) |

### C2. Variables opcionales

| Variable | Descripción |
|----------|-------------|
| `META_ACCESS_TOKEN` | Fallback si no usás `/settings` |
| `META_AD_ACCOUNT_ID` | Fallback cuenta de anuncios |
| `DASHBOARD_PASSWORD` | Proteger la vista del cliente (env) |

### C3. Deploy

1. Conectá el repo en Vercel.
2. Cargá las variables en **Settings → Environment Variables**.
3. **Redeploy** después de cambiar variables.

**Producción actual:** https://ga-dashboard-meta-adnf.vercel.app

---

## Parte D — Configurar desde la web (por cliente)

### D1. Entrar a Configuración

1. Abrí `https://tu-dominio.vercel.app/settings`
2. Ingresá la **ADMIN_PASSWORD** (la de Vercel, no la del cliente).

### D2. Cargar Meta

1. **Token de Meta** → pegá el token `EAA…`
2. **Cuenta y página** → elegí del listado (se cargan solas con el token)
3. **Contraseña del dashboard** (opcional) → para que el cliente tenga que loguearse en `/`
4. Clic en **Guardar configuración**

### D3. Verificar

1. Andá a `/` (Reportes).
2. Deberías ver KPIs, gráficos y tablas del mes actual.
3. Si dice "API no configurada" → revisá token y Ad Account ID.

### D4. Personalizar el dashboard (admin)

1. En `/`, botón **✎ Personalizar**
2. **Widgets** — qué mostrar/ocultar
3. **Metas** — objetivos del mes (cada mes puede tener metas distintas)
4. **Opciones** — desactivar **Campañas** si solo usan reportes (sin BM verificado)

---

## Parte E — Agregar un cliente nuevo

### E1. Checklist

- [ ] Archivo `clients/nombre-cliente.json`
- [ ] Logo en `public/clients/nombre-cliente/logo.svg` (o PNG)
- [ ] Registro en `src/lib/clients.ts`
- [ ] Deploy en Vercel (o cambiar `CLIENT_ID`)
- [ ] Guardar token en `/settings` para ese cliente
- [ ] Probar `/` con datos reales

### E2. Crear el archivo de branding

Copiá `clients/go-apple.json` → `clients/mi-cliente.json`:

```json
{
  "id": "mi-cliente",
  "name": "Nombre Comercial",
  "tagline": "Reportes de Meta Ads",
  "logo": "/clients/mi-cliente/logo.svg",
  "primaryColor": "#0071e3",
  "accentColor": "#1d1d1f",
  "currency": "ARS",
  "locale": "es-AR",
  "timezone": "America/Argentina/Buenos_Aires",
  "defaultCountries": ["AR"]
}
```

### E3. Registrar en código

En `src/lib/clients.ts`:

```typescript
import miCliente from "../../clients/mi-cliente.json";

const CLIENTS: Record<string, ClientConfig> = {
  "go-apple": goApple as ClientConfig,
  "mi-cliente": miCliente as ClientConfig,
};
```

### E4. Logo

Colocá el logo en:

```
public/clients/mi-cliente/logo.svg
```

### E5. Deploy y configuración

**Opción A — Un deploy por cliente (más simple)**  
Vercel → duplicar proyecto → `CLIENT_ID=mi-cliente` → configurar `/settings`.

**Opción B — Multi-cliente en un solo deploy**  
Varios clientes en `clients.ts`. El admin cambia de cliente con el selector del header (requiere login admin).

### E6. Configurar la API del nuevo cliente

1. Entrá a `/settings` (con el cliente correcto activo).
2. Pegá el **token de Meta de ese cliente** (cuenta de anuncios distinta).
3. Elegí su Ad Account → **Guardar**.

Cada cliente tiene su propia fila en Supabase (`client_slug = mi-cliente`).

---

## Parte F — Desarrollo local

```bash
cd DASHBOARD
npm install
cp .env.example .env.local
# Editá .env.local con tus claves
npm run dev
```

Si el servidor falla con error 500:

```bash
npm run dev:clean
```

Abrí http://localhost:3000

---

## Solución de problemas

| Problema | Solución |
|----------|----------|
| "API no configurada" | Token o Ad Account vacío en `/settings` o env |
| "No autorizado" en reportes | Configurá `DASHBOARD_PASSWORD` y logueate |
| Token inválido | Regenerar en Meta, pegar sin comillas |
| Internal Server Error local | `rm -rf .next` y `npm run dev:clean` |
| No aparecen campañas en selector | Verificá permiso `ads_read` y que haya gasto en el mes |
| Crear anuncios falla | App en desarrollo o BM no verificado → usar Ads Manager |
| Supabase no guarda | Revisá `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en Vercel |

---

## Contactos y links útiles

| Recurso | URL |
|---------|-----|
| Repo | https://github.com/ramaskere/GA-dashboard-meta |
| Meta Developers | https://developers.facebook.com/ |
| Graph API Explorer | https://developers.facebook.com/tools/explorer/ |
| Supabase | https://supabase.com/dashboard |
| Vercel | https://vercel.com/dashboard |

---

*Documento interno del equipo. Actualizar cuando cambie el flujo de configuración.*
