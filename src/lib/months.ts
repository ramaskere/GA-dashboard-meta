/** Utilidades de período mensual para el dashboard. */

export interface MonthRange {
  since: string;
  until: string;
}

export interface MonthOption {
  value: string;
  label: string;
  isCurrent: boolean;
}

export function currentMonthKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthToTimeRange(monthKey: string): MonthRange {
  const [yStr, mStr] = monthKey.split("-");
  const year = Number(yStr);
  const month = Number(mStr);
  if (!year || !month || month < 1 || month > 12) {
    throw new Error("Mes inválido. Usá formato YYYY-MM");
  }
  const since = `${monthKey}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const until = `${monthKey}-${String(lastDay).padStart(2, "0")}`;
  return { since, until };
}

export function formatMonthLabel(monthKey: string, locale = "es-AR"): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  const label = d.toLocaleDateString(locale, { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function listMonthOptions(count = 12, from = new Date()): MonthOption[] {
  const current = currentMonthKey(from);
  const options: MonthOption[] = [];

  for (let i = 0; i < count; i++) {
    const d = new Date(from.getFullYear(), from.getMonth() - i, 1);
    const value = currentMonthKey(d);
    options.push({
      value,
      label: formatMonthLabel(value),
      isCurrent: value === current,
    });
  }

  return options;
}

/** % del mes transcurrido (solo útil para el mes en curso). */
export function monthElapsedPercent(monthKey: string, now = new Date()): number {
  if (monthKey !== currentMonthKey(now)) return 100;
  const [y, m] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const day = now.getDate();
  return Math.round((day / daysInMonth) * 100);
}

export function isValidMonthKey(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function previousMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return currentMonthKey(d);
}

export function daysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}
