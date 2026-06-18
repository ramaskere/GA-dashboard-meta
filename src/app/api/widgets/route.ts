import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { getClientId } from "@/lib/clients";
import { getPublicSettings, saveWidgetConfig } from "@/lib/settings";
import { normalizeWidgetConfig } from "@/lib/widgets";

export async function GET() {
  try {
    const settings = await getPublicSettings();
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
    const widgetConfig = normalizeWidgetConfig(body.widgetConfig);
    await saveWidgetConfig(getClientId(), widgetConfig);
    return NextResponse.json({ ok: true, widgetConfig });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
