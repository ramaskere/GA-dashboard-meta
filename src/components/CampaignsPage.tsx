"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClientConfig } from "@/lib/clients";
import { clientCssVars } from "@/lib/format";
import { AppHeader } from "./AppHeader";
import { AdminLoginGate } from "./AdminLoginGate";
import { SegmentationFields } from "./SegmentationFields";
import { BudgetFields } from "./BudgetFields";
import {
  defaultSegmentation,
  campaignHasBudget,
  type AdSetSegmentation,
  type BudgetLevel,
} from "@/lib/adset-segmentation";
import { CAMPAIGN_OBJECTIVES } from "@/lib/meta-manage";
import { MetaAssetPicker } from "./MetaAssetPicker";

type Tab = "campaign" | "adset" | "ad" | "wizard";

interface CampaignsData {
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    objective: string;
    daily_budget?: string;
    lifetime_budget?: string;
  }>;
  adSets: Array<{
    id: string;
    name: string;
    status: string;
    campaign_id: string;
  }>;
  ads: Array<{ id: string; name: string; status: string; adset_id?: string }>;
  pages: Array<{ id: string; name: string }>;
  pixels: Array<{ id: string; name: string }>;
  objectives: Array<{ value: string; label: string }>;
  accountCurrency?: string;
  suggestedMinDailyBudget?: number;
  adAccountId?: string;
  defaultPageId?: string;
}

interface CampaignsPageProps {
  client: ClientConfig;
  availableClients?: Pick<ClientConfig, "id" | "name">[];
}

const TABS: { id: Tab; label: string }[] = [
  { id: "campaign", label: "Campaña" },
  { id: "adset", label: "Ad set" },
  { id: "ad", label: "Anuncio" },
  { id: "wizard", label: "1 → 1 → 1" },
];

const inputCls =
  "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--client-primary)]";

export function CampaignsPage({ client, availableClients = [] }: CampaignsPageProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<Tab>("campaign");
  const [data, setData] = useState<CampaignsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [pageId, setPageId] = useState("");

  const [campName, setCampName] = useState("");
  const [objective, setObjective] = useState("OUTCOME_TRAFFIC");
  const [campBudgetLevel, setCampBudgetLevel] = useState<BudgetLevel>("adset");
  const [campBudget, setCampBudget] = useState("");

  const [adSetName, setAdSetName] = useState("");
  const [adSetCampaignId, setAdSetCampaignId] = useState("");
  const [adSetBudgetLevel, setAdSetBudgetLevel] = useState<BudgetLevel>("adset");
  const [adSetBudget, setAdSetBudget] = useState("");

  const [adSetId, setAdSetId] = useState("");
  const [adName, setAdName] = useState("");
  const [primaryText, setPrimaryText] = useState("");
  const [headline, setHeadline] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const [wizCamp, setWizCamp] = useState("");
  const [wizAdSet, setWizAdSet] = useState("");
  const [wizObjective, setWizObjective] = useState("OUTCOME_TRAFFIC");
  const [wizBudgetLevel, setWizBudgetLevel] = useState<BudgetLevel>("adset");
  const [wizBudget, setWizBudget] = useState("");
  const [wizAdSetId, setWizAdSetId] = useState("");
  const [segmentation, setSegmentation] = useState<AdSetSegmentation>(() =>
    defaultSegmentation(client.defaultCountries)
  );
  const [wizSegmentation, setWizSegmentation] = useState<AdSetSegmentation>(() =>
    defaultSegmentation(client.defaultCountries)
  );

  const style = clientCssVars(client);
  const accountCurrency = data?.accountCurrency || client.currency;

  const selectedCampaign =
    data?.campaigns.find((c) => c.id === adSetCampaignId);

  const selectedCampaignObjective =
    selectedCampaign?.objective || "OUTCOME_TRAFFIC";

  const objectives = data?.objectives?.length
    ? data.objectives
    : CAMPAIGN_OBJECTIVES;

  const selectedCampaignHasCbo = campaignHasBudget(selectedCampaign);

  function segPayload(seg: AdSetSegmentation) {
    return {
      countries: seg.countries,
      ageMin: seg.ageMin,
      ageMax: seg.ageMax,
      placement: seg.placement,
      pixelId: seg.pixelId,
      pixelEvent: seg.pixelEvent,
      pageId: pageId || seg.pageId,
    };
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns");
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Error al cargar");
        setData(null);
      } else {
        setData(json);
        setPageId(
          (p) => p || json.defaultPageId || json.pages?.[0]?.id || ""
        );
        setAdSetCampaignId((c) => c || json.campaigns?.[0]?.id || "");
        setAdSetId((a) => a || json.adSets?.[0]?.id || "");
        const firstPixel = json.pixels?.[0]?.id;
        if (firstPixel) {
          setSegmentation((s) => ({ ...s, pixelId: s.pixelId || firstPixel }));
          setWizSegmentation((s) => ({ ...s, pixelId: s.pixelId || firstPixel }));
        }
      }
    } catch {
      setError("No se pudo conectar con el servidor. ¿Está corriendo npm run dev?");
      setData(null);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) load();
  }, [authenticated, load]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin-auth")
      .then((res) => {
        if (!cancelled) setAuthenticated(res.ok);
      })
      .catch(() => {
        if (!cancelled) setAuthenticated(false);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [lastSuccess, setLastSuccess] = useState(false);

  async function postCampaign(body: Record<string, unknown>) {
    setMessage(null);
    setLastSuccess(false);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(json.error || "Error");
        return null;
      }
      setMessage(json.message || "Listo");
      setLastSuccess(true);
      await load();
      return json;
    } catch {
      setMessage("No se pudo conectar con el servidor");
      return null;
    }
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    const result = await postCampaign({
      action: "create_campaign",
      name: campName,
      objective,
      budgetLevel: campBudgetLevel,
      dailyBudget:
        campBudgetLevel === "campaign" ? Number(campBudget) : undefined,
    });
    if (result) {
      setCampName("");
      setTab("adset");
      setAdSetCampaignId(result.campaignId);
    }
  }

  async function handleCreateAdSet(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCampaignHasCbo) {
      const budget = Number(adSetBudget);
      if (!budget || budget <= 0) {
        setMessage("Indicá el presupuesto diario del ad set (ABO)");
        setLastSuccess(false);
        return;
      }
    }
    const result = await postCampaign({
      action: "create_adset",
      name: adSetName,
      campaignId: adSetCampaignId,
      budgetLevel: selectedCampaignHasCbo ? "campaign" : "adset",
      dailyBudget: selectedCampaignHasCbo ? undefined : Number(adSetBudget),
      ...segPayload({ ...segmentation, pageId }),
    });
    if (result) {
      setAdSetName("");
      setAdSetId(result.adSetId);
      setTab("ad");
    }
  }

  async function handleWizard(e: React.FormEvent) {
    e.preventDefault();
    const result = await postCampaign({
      action: "create_full",
      campaignName: wizCamp,
      adSetName: wizAdSet,
      objective: wizObjective,
      budgetLevel: wizBudgetLevel,
      dailyBudget: Number(wizBudget),
      ...segPayload({ ...wizSegmentation, pageId }),
    });
    if (result) {
      setWizAdSetId(result.adSetId);
      setAdSetId(result.adSetId);
      setWizCamp("");
      setWizAdSet("");
      setTab("ad");
    }
  }

  async function handleUploadAd(e: React.FormEvent) {
    e.preventDefault();
    setLastSuccess(false);
    if (!image) {
      setMessage("Seleccioná una imagen");
      return;
    }
    if (!adSetId) {
      setMessage("Elegí un ad set");
      return;
    }
    if (!pageId.trim()) {
      setMessage(
        "Falta la página de Facebook. Elegila abajo o pegá el Page ID manualmente."
      );
      return;
    }
    if (!primaryText.trim() || !headline.trim()) {
      setMessage("Completá el texto principal y el título");
      return;
    }
    if (!linkUrl.trim()) {
      setMessage("Completá la URL del anuncio");
      return;
    }
    setMessage(null);
    const form = new FormData();
    form.set("image", image);
    form.set("adSetId", adSetId);
    form.set("pageId", pageId.trim());
    form.set("adName", adName.trim() || headline.trim() || "Nuevo anuncio");
    form.set("primaryText", primaryText);
    form.set("headline", headline);
    form.set("linkUrl", linkUrl);

    try {
      const res = await fetch("/api/ads", { method: "POST", body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(json.error || "Error");
        setLastSuccess(false);
        return;
      }
      setMessage(json.message || "Anuncio creado");
      setLastSuccess(true);
      setImage(null);
      setAdName("");
      setPrimaryText("");
      setHeadline("");
      load();
    } catch {
      setMessage("No se pudo conectar con el servidor");
      setLastSuccess(false);
    }
  }

  if (checking) {
    return (
      <div
        className="flex min-h-screen items-center justify-center text-sm text-gray-400"
        style={style}
      >
        Cargando…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div style={style}>
        <AdminLoginGate
          clientName={client.name}
          onSuccess={() => setAuthenticated(true)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={style}>
      <AppHeader
        client={client}
        active="campaigns"
        availableClients={availableClients}
        isAdmin
      />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="mb-4 text-sm text-gray-500">
          Cada cosa por separado o el flujo <strong>1 → 1 → 1</strong>. Todo se
          crea en pausa. Token con <code className="text-xs">ads_management</code>.
        </p>

        <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setMessage(null);
              }}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                tab === t.id
                  ? "bg-[var(--client-primary)] text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {message && (
          <div
            className={`mb-4 rounded-2xl border p-4 text-sm ${
              lastSuccess
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        {tab === "campaign" && (
          <form
            onSubmit={handleCreateCampaign}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <h2 className="text-sm font-semibold">Solo campaña</h2>
            <p className="mt-1 text-xs text-gray-500">
              Podés definir el presupuesto acá (CBO) o después en cada ad set (ABO).
            </p>
            <div className="mt-4 space-y-3">
              <input
                required
                value={campName}
                onChange={(e) => setCampName(e.target.value)}
                placeholder="Nombre de la campaña"
                className={inputCls}
              />
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className={inputCls}
              >
                {(objectives).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <BudgetFields
                level={campBudgetLevel}
                onLevelChange={setCampBudgetLevel}
                amount={campBudget}
                onAmountChange={setCampBudget}
                currency={accountCurrency}
                adSetBudgetLater
              />
            </div>
            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-[var(--client-primary)] py-2.5 text-sm font-medium text-white"
            >
              Crear campaña
            </button>
          </form>
        )}

        {tab === "adset" && (
          <form
            onSubmit={handleCreateAdSet}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <h2 className="text-sm font-semibold">Solo ad set</h2>
            <p className="mt-1 text-xs text-gray-500">
              Elegí una campaña existente. Si la campaña no tiene CBO, definí el presupuesto en el ad set.
            </p>
            <div className="mt-4 space-y-3">
              <input
                required
                value={adSetName}
                onChange={(e) => setAdSetName(e.target.value)}
                placeholder="Nombre del ad set"
                className={inputCls}
              />
              <select
                required
                value={adSetCampaignId}
                onChange={(e) => setAdSetCampaignId(e.target.value)}
                className={inputCls}
              >
                <option value="">Elegí campaña</option>
                {(data?.campaigns || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.objective})
                    {campaignHasBudget(c) ? " · CBO" : ""}
                  </option>
                ))}
              </select>
              <BudgetFields
                level={selectedCampaignHasCbo ? "campaign" : "adset"}
                onLevelChange={setAdSetBudgetLevel}
                amount={adSetBudget}
                onAmountChange={setAdSetBudget}
                currency={accountCurrency}
                showLevelToggle={false}
                campaignHasBudget={selectedCampaignHasCbo}
                onlyAdSetLevel={!selectedCampaignHasCbo}
              />
              <SegmentationFields
                segmentation={segmentation}
                onChange={setSegmentation}
                objective={selectedCampaignObjective}
                pages={data?.pages || []}
                pixels={data?.pixels || []}
                pageId={pageId}
                onPageIdChange={setPageId}
              />
            </div>
            <button
              type="submit"
              disabled={!data?.campaigns?.length}
              className="mt-4 w-full rounded-xl bg-[var(--client-primary)] py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Crear ad set
            </button>
          </form>
        )}

        {tab === "ad" && (
          <form
            onSubmit={handleUploadAd}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <h2 className="text-sm font-semibold">Solo anuncio</h2>
            <p className="mt-1 text-xs text-gray-500">
              Subí creativo a un ad set que ya exista.
            </p>
            <div className="mt-4 space-y-3">
              <MetaAssetPicker
                pagesOnly
                adAccountId={data?.adAccountId || ""}
                onAdAccountIdChange={() => {}}
                pageId={pageId}
                onPageIdChange={setPageId}
              />
              <select
                required
                value={adSetId}
                onChange={(e) => setAdSetId(e.target.value)}
                className={inputCls}
              >
                <option value="">Elegí ad set</option>
                {(data?.adSets || []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.status})
                  </option>
                ))}
              </select>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="w-full text-sm"
              />
              <input
                value={adName}
                onChange={(e) => setAdName(e.target.value)}
                placeholder="Nombre del anuncio"
                className={inputCls}
              />
              <textarea
                required
                value={primaryText}
                onChange={(e) => setPrimaryText(e.target.value)}
                placeholder="Texto principal"
                rows={2}
                className={inputCls}
              />
              <input
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Título"
                className={inputCls}
              />
              <input
                required
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://tu-tienda.com"
                className={inputCls}
              />
            </div>
            <button
              type="submit"
              disabled={!data?.adSets?.length}
              className="mt-4 w-full rounded-xl bg-[var(--client-primary)] py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Crear anuncio
            </button>
          </form>
        )}

        {tab === "wizard" && (
          <form
            onSubmit={handleWizard}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <h2 className="text-sm font-semibold">Flujo 1 campaña → 1 ad set → 1 anuncio</h2>
            <p className="mt-1 text-xs text-gray-500">
              Paso 1 y 2 juntos acá. Después te lleva a la pestaña Anuncio para
              subir el creativo.
            </p>
            <div className="mt-4 space-y-3">
              <input
                required
                value={wizCamp}
                onChange={(e) => setWizCamp(e.target.value)}
                placeholder="Nombre campaña"
                className={inputCls}
              />
              <select
                value={wizObjective}
                onChange={(e) => setWizObjective(e.target.value)}
                className={inputCls}
              >
                {(objectives).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                required
                value={wizAdSet}
                onChange={(e) => setWizAdSet(e.target.value)}
                placeholder="Nombre ad set"
                className={inputCls}
              />
              <BudgetFields
                level={wizBudgetLevel}
                onLevelChange={setWizBudgetLevel}
                amount={wizBudget}
                onAmountChange={setWizBudget}
                currency={accountCurrency}
              />
              <SegmentationFields
                segmentation={wizSegmentation}
                onChange={setWizSegmentation}
                objective={wizObjective}
                pages={data?.pages || []}
                pixels={data?.pixels || []}
                pageId={pageId}
                onPageIdChange={setPageId}
              />
            </div>
            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-[var(--client-primary)] py-2.5 text-sm font-medium text-white"
            >
              Crear campaña + ad set
            </button>
            {wizAdSetId && (
              <p className="mt-3 text-center text-xs text-green-700">
                Ad set listo. Andá a la pestaña <strong>Anuncio</strong> para subir
                el creativo.
              </p>
            )}
          </form>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { title: "Campañas", count: data?.campaigns.length ?? 0 },
            { title: "Ad sets", count: data?.adSets.length ?? 0 },
            { title: "Anuncios", count: data?.ads.length ?? 0 },
          ].map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm"
            >
              <p className="text-2xl font-semibold">{loading ? "…" : s.count}</p>
              <p className="text-xs text-gray-500">{s.title}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
