import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { getPublicSettings, getMetaCredentials } from "@/lib/settings";
import {
  listCampaigns,
  listAdSets,
  listAds,
  createCampaign,
  createAdSet,
  getAdAccountPages,
  CAMPAIGN_OBJECTIVES,
} from "@/lib/meta-manage";

export async function GET() {
  try {
    const pub = await getPublicSettings();
    if (!pub.configured) {
      return NextResponse.json(
        { error: "API no configurada", needsSetup: true },
        { status: 503 }
      );
    }

    const { token, adAccountId } = await getMetaCredentials();
    const [campaigns, adSets, ads, pages] = await Promise.all([
      listCampaigns(adAccountId, token),
      listAdSets(adAccountId, token),
      listAds(adAccountId, token),
      getAdAccountPages(adAccountId, token).catch(() => []),
    ]);

    return NextResponse.json({
      campaigns,
      adSets,
      ads,
      pages,
      objectives: CAMPAIGN_OBJECTIVES,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      {
        error: message,
        hint: "Para crear campañas el token necesita permiso ads_management.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthed(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { token, adAccountId } = await getMetaCredentials();

    if (body.action === "create_campaign") {
      const campaign = await createCampaign(adAccountId, token, {
        name: String(body.name || "").trim(),
        objective: String(body.objective || "OUTCOME_TRAFFIC"),
        dailyBudget: body.dailyBudget ? Number(body.dailyBudget) : undefined,
        status: "PAUSED",
      });

      let adSetId: string | null = null;
      if (body.createAdSet && body.dailyBudget) {
        const adSet = await createAdSet(adAccountId, token, {
          name: `${body.name} — Ad Set`,
          campaignId: campaign.id,
          dailyBudget: Number(body.dailyBudget),
          pageId: body.pageId ? String(body.pageId) : undefined,
        });
        adSetId = adSet.id;
      }

      return NextResponse.json({
        ok: true,
        campaignId: campaign.id,
        adSetId,
        message: "Campaña creada en pausa. Revisala en Meta Ads Manager.",
      });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
