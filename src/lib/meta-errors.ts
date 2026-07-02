/** Mensajes claros para errores frecuentes de Meta Graph API. */
export function humanizeMetaError(raw: string): string {
  const msg = raw.trim();
  const lower = msg.toLowerCase();

  if (
    lower.includes("postcard") &&
    lower.includes("payload")
  ) {
    return (
      "Token de Meta inválido o mal copiado. Pegá solo el access token " +
      "(suele empezar con EAA…), sin comillas ni espacios. Generá uno nuevo en " +
      "Business Manager (System User) o en el Graph API Explorer."
    );
  }

  if (lower.includes("session has expired") || lower.includes("error validating access token")) {
    return (
      "El token de Meta caducó. Generá uno nuevo y actualizalo en Configuración (/settings)."
    );
  }

  if (lower.includes("invalid oauth") || lower.includes("malformed access token")) {
    return (
      "Token de Meta con formato incorrecto. Revisá que no tenga espacios, saltos de línea " +
      "ni texto extra al copiarlo."
    );
  }

  if (lower.includes("modo de desarrollo") || lower.includes("development mode")) {
    return (
      "Tu app de Meta está en modo Desarrollo. Para crear anuncios, pasala a modo " +
      "Live (Publicada) en developers.facebook.com → tu app → Publicar."
    );
  }

  if (lower.includes("ads_management") || lower.includes("permission")) {
    return `${msg} — El token necesita permiso ads_management (y ads_read para reportes).`;
  }

  return msg;
}
