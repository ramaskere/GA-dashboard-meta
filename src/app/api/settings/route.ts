import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { getClientConfig, getClientId } from "@/lib/clients";
import { getPublicSettings, saveSettings } from "@/lib/settings";

export async function GET(request: NextRequest) {
  if (!isAdminAuthed(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const client = getClientConfig();
    const settings = await getPublicSettings();

    return NextResponse.json({
      client: { id: client.id, name: client.name },
      settings,
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
    const clientSlug = getClientId();

    await saveSettings(clientSlug, {
      metaAccessToken:
        body.metaAccessToken !== undefined
          ? String(body.metaAccessToken)
          : undefined,
      metaAdAccountId:
        body.metaAdAccountId !== undefined
          ? String(body.metaAdAccountId)
          : undefined,
      dashboardPassword:
        body.dashboardPassword !== undefined
          ? body.dashboardPassword
            ? String(body.dashboardPassword)
            : null
          : undefined,
    });

    const settings = await getPublicSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
