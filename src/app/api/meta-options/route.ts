import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { getMetaCredentials } from "@/lib/settings";
import { normalizeMetaAccessToken, validateMetaAccessToken } from "@/lib/tokens";
import { listAdAccounts, getAdAccountPages } from "@/lib/meta-manage";

function normalizeAccountId(id: string): string {
  const trimmed = id.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("act_") ? trimmed : `act_${trimmed}`;
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthed(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    let token = body.token ? normalizeMetaAccessToken(String(body.token)) : "";

    if (!token) {
      const creds = await getMetaCredentials();
      token = creds.token;
    } else {
      const tokenError = validateMetaAccessToken(token);
      if (tokenError) {
        return NextResponse.json({ error: tokenError }, { status: 400 });
      }
    }

    const adAccounts = await listAdAccounts(token);
    const adAccountId = body.adAccountId
      ? normalizeAccountId(String(body.adAccountId))
      : "";

    let pages: Array<{ id: string; name: string }> = [];
    if (adAccountId) {
      pages = await getAdAccountPages(adAccountId, token);
    }

    return NextResponse.json({ adAccounts, pages });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
