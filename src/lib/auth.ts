import { NextRequest } from "next/server";
import { getDashboardPassword } from "./settings";

export function getAdminPassword(): string | null {
  const pwd = process.env.ADMIN_PASSWORD?.trim();
  return pwd || null;
}

export async function isDashboardAuthed(request: NextRequest): Promise<boolean> {
  const password = await getDashboardPassword();
  if (!password) return true;

  const cookie = request.cookies.get("dashboard_auth")?.value;
  return cookie === password;
}

export function isAdminAuthed(request: NextRequest): boolean {
  const password = getAdminPassword();
  if (!password) return true;

  const cookie = request.cookies.get("admin_auth")?.value;
  return cookie === password;
}
