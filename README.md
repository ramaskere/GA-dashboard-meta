# Meta Ads Dashboard

Dashboard replicable de reportes de Meta Ads para tus clientes. **Go Apple** es el ejemplo incluido.

## Replicar para un nuevo cliente (3 pasos)

1. **Copiá la config del cliente**
   ```bash
   cp clients/go-apple.json clients/mi-cliente.json
   ```
   Editá nombre, colores, logo en `public/clients/mi-cliente/`.

2. **Registrá el cliente** en `src/lib/clients.ts`:
   ```ts
   import miCliente from "../../clients/mi-cliente.json";
   // ...
   "mi-cliente": miCliente as ClientConfig,
   ```

3. **Variables de entorno** (local o Vercel):
   ```env
   CLIENT_ID=mi-cliente
   META_ACCESS_TOKEN=tu_token_de_meta
   META_AD_ACCOUNT_ID=act_123456789
   DASHBOARD_PASSWORD=opcional_para_proteger
   ```

## Desarrollo local

```bash
cd DASHBOARD
npm install
cp .env.example .env.local
# Editá .env.local con tu token y ad account
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## Deploy en Vercel

1. Subí el repo a GitHub (o conectá la carpeta `DASHBOARD`).
2. En [vercel.com](https://vercel.com) → **New Project** → importá el repo.
3. **Root Directory**: `DASHBOARD` (si el repo es el monorepo GO APPLE).
4. En **Environment Variables** agregá:
   - `META_ACCESS_TOKEN`
   - `META_AD_ACCOUNT_ID`
   - `CLIENT_ID` → `go-apple`
   - `DASHBOARD_PASSWORD` (opcional)
5. Deploy.

Para otro cliente: nuevo proyecto en Vercel con otro `CLIENT_ID` y credenciales Meta, o duplicá el proyecto y cambiá solo las env vars.

## Token de Meta

Necesitás un **System User Token** o **Long-Lived User Token** con permisos:

- `ads_read`
- `read_insights`

En [Meta Business Suite](https://business.facebook.com) → Configuración → Usuarios del sistema → Generar token.

El **Ad Account ID** está en Administrador de anuncios → Configuración de la cuenta (formato `act_123456789`).

## Estructura

```
DASHBOARD/
├── clients/           # Config por cliente (branding)
├── public/clients/    # Logos
├── src/
│   ├── app/api/       # API routes (token solo en servidor)
│   ├── components/    # UI del dashboard
│   └── lib/           # Meta API + helpers
└── .env.example
```

El token **nunca** va al navegador: solo se usa en `/api/insights` en el servidor.
