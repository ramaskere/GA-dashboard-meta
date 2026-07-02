import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { getMetaCredentials } from "@/lib/settings";
import {
  uploadAdImage,
  createAdWithImage,
} from "@/lib/meta-manage";

export async function POST(request: NextRequest) {
  if (!isAdminAuthed(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Falta la imagen" }, { status: 400 });
    }

    const adSetId = String(form.get("adSetId") || "").trim();
    const pageId = String(form.get("pageId") || "").trim();
    const adName = String(form.get("adName") || "Nuevo anuncio").trim();
    const primaryText = String(form.get("primaryText") || "").trim();
    const headline = String(form.get("headline") || "").trim();
    const linkUrl = String(form.get("linkUrl") || "").trim();

    if (!adSetId) {
      return NextResponse.json({ error: "Elegí un ad set" }, { status: 400 });
    }
    if (!pageId) {
      return NextResponse.json(
        {
          error:
            "Falta la página de Facebook. Elegila en el selector o pegá el Page ID.",
        },
        { status: 400 }
      );
    }
    if (!primaryText || !headline) {
      return NextResponse.json(
        { error: "Completá el texto principal y el título" },
        { status: 400 }
      );
    }
    if (!linkUrl) {
      return NextResponse.json({ error: "Completá la URL del anuncio" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer()).toString("base64");
    const { token, adAccountId } = await getMetaCredentials();

    const imageHash = await uploadAdImage(
      adAccountId,
      token,
      bytes,
      file.name || "creative.jpg"
    );

    const ad = await createAdWithImage(adAccountId, token, {
      adSetId,
      pageId,
      imageHash,
      adName,
      primaryText,
      headline,
      linkUrl,
    });

    return NextResponse.json({
      ok: true,
      adId: ad.id,
      message: "Anuncio creado en pausa. Activá desde Meta Ads Manager.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      {
        error: message,
        hint: "Verificá permiso ads_management y que la página de Facebook esté vinculada.",
      },
      { status: 500 }
    );
  }
}
