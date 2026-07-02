/** Limpia y valida tokens de Meta antes de guardar o usar. */
export function normalizeMetaAccessToken(raw: string): string {
  let token = raw.trim();
  if (token.toLowerCase().startsWith("bearer ")) {
    token = token.slice(7).trim();
  }
  token = token.replace(/^["']|["']$/g, "");
  token = token.replace(/\s+/g, "");
  return token;
}

export function validateMetaAccessToken(token: string): string | null {
  if (!token) {
    return "El token de Meta no puede estar vacío";
  }
  if (token.length < 20) {
    return "El token parece demasiado corto. Copiá el access token completo desde Meta.";
  }
  if (/\s/.test(token)) {
    return "El token no debe tener espacios ni saltos de línea";
  }
  // Tokens de usuario / system user de Meta suelen empezar con EAA
  if (!/^EAA[A-Za-z0-9]+$/i.test(token) && !/^[A-Za-z0-9_|.-]+$/.test(token)) {
    return "Formato de token inválido. Debe ser un access token de Meta (ej. EAA…)";
  }
  return null;
}

/** Detecta errores de Supabase por clave o schema desactualizado. */
export function humanizeSupabaseError(raw: string): string {
  const lower = raw.toLowerCase();

  if (lower.includes("meta_page_id")) {
    return (
      "Falta la columna meta_page_id en Supabase. Ejecutá: " +
      "ALTER TABLE dashboard_settings ADD COLUMN IF NOT EXISTS meta_page_id text NOT NULL DEFAULT '';"
    );
  }

  if (lower.includes("widget_config")) {
    return (
      "Falta la columna widget_config en Supabase. Ejecutá en el SQL Editor: " +
      "ALTER TABLE dashboard_settings ADD COLUMN IF NOT EXISTS widget_config jsonb NOT NULL DEFAULT '{}'::jsonb;"
    );
  }

  if (
    lower.includes("jwt") ||
    lower.includes("postcard") ||
    lower.includes("invalid api key")
  ) {
    return (
      "Clave de Supabase inválida. En Vercel/.env.local usá SUPABASE_SERVICE_ROLE_KEY " +
      "(la clave service_role que empieza con eyJ…) desde Supabase → Settings → API."
    );
  }

  return raw;
}
