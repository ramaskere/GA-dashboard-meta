import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import {
  CLIENT_COOKIE,
  listClients,
  resolveClientId,
} from "@/lib/clients";

export async function GET() {
  return NextResponse.json({
    clients: listClients().map((c) => ({
      id: c.id,
      name: c.name,
      logo: c.logo,
    })),
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthed(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const clientId = String(body.clientId || "").trim();
    const resolved = resolveClientId(clientId);

    if (resolved !== clientId) {
      return NextResponse.json({ error: "Cliente no válido" }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true, clientId });
    res.cookies.set(CLIENT_COOKIE, clientId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
