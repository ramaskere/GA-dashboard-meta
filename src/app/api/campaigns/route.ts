import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { getPublicSettings, getMetaCredentials } from "@/lib/settings";
import { parseSegmentationFromBody } from "@/lib/adset-segmentation";
import {
  listCampaigns,
  listAdSets,
  listAds,
  createCampaign,
  createAdSet,
  getAdAccountPages,
  listPixels,
  CAMPAIGN_OBJECTIVES,
  SUGGESTED_MIN_DAILY_BUDGET_ARS,
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
    const [campaigns, adSets, ads, pages, pixels] = await Promise.all([
      listCampaigns(adAccountId, token),
      listAdSets(adAccountId, token),
      listAds(adAccountId, token),
      getAdAccountPages(adAccountId, token).catch(() => []),
      listPixels(adAccountId, token).catch(() => []),
    ]);

    return NextResponse.json({
      campaigns,
      adSets,
      ads,
      pages,
      pixels,
      objectives: CAMPAIGN_OBJECTIVES,
      suggestedMinDailyBudgetArs: SUGGESTED_MIN_DAILY_BUDGET_ARS,
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
    const action = String(body.action || "");
    const segmentation = parseSegmentationFromBody(body);

    if (action === "create_campaign") {
      const name = String(body.name || "").trim();
      if (!name) {
        return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
      }

      const campaign = await createCampaign(adAccountId, token, {
        name,
        objective: String(body.objective || "OUTCOME_TRAFFIC"),
        status: "PAUSED",
      });

      return NextResponse.json({
        ok: true,
        campaignId: campaign.id,
        message: `Campaña "${name}" creada en pausa.`,
      });
    }

    if (action === "create_adset") {
      const name = String(body.name || "").trim();
      const campaignId = String(body.campaignId || "").trim();
      const dailyBudget = Number(body.dailyBudget);

      if (!name || !campaignId) {
        return NextResponse.json(
          { error: "Nombre y campaña requeridos" },
          { status: 400 }
        );
      }

      const adSet = await createAdSet(adAccountId, token, {
        name,
        campaignId,
        dailyBudget,
        segmentation,
      });

      return NextResponse.json({
        ok: true,
        adSetId: adSet.id,
        message: `Ad set "${name}" creado en pausa.`,
      });
    }

    if (action === "create_full") {
      const campName = String(body.campaignName || "").trim();
      const adSetName = String(body.adSetName || "").trim();
      const objective = String(body.objective || "OUTCOME_TRAFFIC");
      const dailyBudget = Number(body.dailyBudget);

      if (!campName || !adSetName || !dailyBudget) {
        return NextResponse.json(
          { error: "Completá nombre de campaña, ad set y presupuesto" },
          { status: 400 }
        );
      }

      const campaign = await createCampaign(adAccountId, token, {
        name: campName,
        objective,
        status: "PAUSED",
      });

      const adSet = await createAdSet(adAccountId, token, {
        name: adSetName,
        campaignId: campaign.id,
        dailyBudget,
        objective,
        segmentation,
      });

      return NextResponse.json({
        ok: true,
        campaignId: campaign.id,
        adSetId: adSet.id,
        message: "Campaña y ad set creados en pausa. Ahora subí el anuncio.",
      });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
