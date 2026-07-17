import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import {
  createClientInDb,
  isValidClientSlug,
  listAllClients,
  slugifyClientName,
} from "@/lib/client-registry";
import { CLIENT_COOKIE } from "@/lib/clients";

export async function GET() {
  try {
    const clients = await listAllClients();
    return NextResponse.json({
      clients: clients.map((c) => ({
        id: c.id,
        name: c.name,
        logo: c.logo,
        primaryColor: c.primaryColor,
        currency: c.currency,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthed(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    let id = String(body.id || "").trim().toLowerCase();

    if (!name) {
      return NextResponse.json(
        { error: "El nombre del cliente es obligatorio." },
        { status: 400 }
      );
    }

    if (!id) id = slugifyClientName(name);
    if (!isValidClientSlug(id)) {
      return NextResponse.json(
        {
          error:
            "ID inválido. Usá minúsculas, números y guiones (ej. mi-cliente).",
        },
        { status: 400 }
      );
    }

    const client = await createClientInDb({
      id,
      name,
      tagline: body.tagline ? String(body.tagline) : undefined,
      primaryColor: body.primaryColor ? String(body.primaryColor) : undefined,
      accentColor: body.accentColor ? String(body.accentColor) : undefined,
      currency: body.currency ? String(body.currency) : "ARS",
      logo: body.logo ? String(body.logo) : undefined,
    });

    const switchTo = body.switchTo !== false;
    const res = NextResponse.json({ ok: true, client });

    if (switchTo) {
      res.cookies.set(CLIENT_COOKIE, client.id, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    const status = message.includes("ya existe") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
