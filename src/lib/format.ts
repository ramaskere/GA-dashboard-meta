import type { CSSProperties } from "react";
import type { ClientConfig } from "./clients";

export function formatCurrency(
  value: number,
  currency: string,
  locale = "es-AR"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, locale = "es-AR"): string {
  return new Intl.NumberFormat(locale).format(Math.round(value));
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDateLabel(dateStr: string, locale = "es-AR"): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

export function clientCssVars(client: ClientConfig): CSSProperties {
  return {
    "--client-primary": client.primaryColor,
    "--client-accent": client.accentColor,
  } as CSSProperties;
}
