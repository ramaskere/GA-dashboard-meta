import { NextRequest, NextResponse } from "next/server";
import { getAdminPassword, isAdminAuthed } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!getAdminPassword()) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_PASSWORD no configurada" },
      { status: 503 }
    );
  }

  if (!isAdminAuthed(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  const password = getAdminPassword();

  if (!password) {
    return NextResponse.json({
      ok: false,
      error: "ADMIN_PASSWORD no configurada en el servidor",
    }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const submitted = String(body.password || "");

  if (submitted !== password) {
    return NextResponse.json({ error: "Contraseña de admin incorrecta" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_auth", password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("admin_auth");
  return response;
}
