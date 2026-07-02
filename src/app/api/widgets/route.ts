import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import {
  getClientConfig,
  resolveClientIdFromRequest,
} from "@/lib/clients";
import { getPublicSettings, saveWidgetConfig } from "@/lib/settings";
import { normalizeWidgetConfig } from "@/lib/widgets";

export async function GET(request: NextRequest) {
  try {
    const clientId = resolveClientIdFromRequest(request);
    const settings = await getPublicSettings(clientId);
    return NextResponse.json({ widgetConfig: settings.widgetConfig });
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
    const clientId = resolveClientIdFromRequest(request);
    const widgetConfig = normalizeWidgetConfig(body.widgetConfig);
    await saveWidgetConfig(clientId, widgetConfig);
    return NextResponse.json({ ok: true, widgetConfig });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
