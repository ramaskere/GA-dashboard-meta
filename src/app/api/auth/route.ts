import { NextRequest, NextResponse } from "next/server";
import { getDashboardPassword } from "@/lib/clients";

export async function POST(request: NextRequest) {
  const password = getDashboardPassword();

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
