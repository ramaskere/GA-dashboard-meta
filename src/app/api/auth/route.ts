import { NextRequest, NextResponse } from "next/server";
import { resolveClientIdFromRequest } from "@/lib/clients";
import { getDashboardPassword } from "@/lib/settings";

export async function POST(request: NextRequest) {
  const clientId = resolveClientIdFromRequest(request);
  const password = await getDashboardPassword(clientId);

  if (!password) {
    return NextResponse.json({ ok: true, protected: false });
  }

  const body = await request.json().catch(() => ({}));
  const submitted = String(body.password || "");

  if (submitted !== password) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("dashboard_auth", password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("dashboard_auth");
  return response;
}
