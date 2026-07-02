"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { ClientConfig } from "@/lib/clients";
import { clientCssVars } from "@/lib/format";
import { AdminLoginGate } from "./AdminLoginGate";
import { AppHeader } from "./AppHeader";
import { MetaAssetPicker } from "./MetaAssetPicker";
import { WidgetEditor } from "./WidgetEditor";
import type { WidgetConfig } from "@/lib/widgets";

interface SettingsData {
  client: { id: string; name: string };
  settings: {
    configured: boolean;
    metaAdAccountId: string;
    metaPageId: string;
    metaAccessTokenSet: boolean;
    metaAccessTokenHint: string | null;
    dashboardPasswordSet: boolean;
    widgetConfig: WidgetConfig;
    updatedAt: string | null;
    source: "supabase" | "env" | "none";
    supabaseReady: boolean;
  };
}

interface SettingsPageProps {
  client: ClientConfig;
  availableClients?: Pick<ClientConfig, "id" | "name">[];
}

export function SettingsPage({ client, availableClients = [] }: SettingsPageProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [data, setData] = useState<SettingsData | null>(null);
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [metaAdAccountId, setMetaAdAccountId] = useState("");
  const [metaPageId, setMetaPageId] = useState("");
  const [dashboardPassword, setDashboardPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const style = clientCssVars(client);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const json = await res.json();
      if (res.ok) {
        setData(json);
        setMetaAdAccountId(json.settings.metaAdAccountId || "");
        setMetaPageId(json.settings.metaPageId || "");
        setAuthenticated(true);
      }
    } catch {
      setAuthenticated(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin-auth")
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setAuthenticated(true);
          loadSettings();
        } else {
          setAuthenticated(false);
          setChecking(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuthenticated(false);
          setChecking(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadSettings]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload: Record<string, string | null> = {
      metaAdAccountId,
      metaPageId,
      dashboardPassword: dashboardPassword || null,
    };

    if (metaAccessToken.trim()) {
      payload.metaAccessToken = metaAccessToken.trim();
    }

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage({ type: "err", text: json.error || "Error al guardar" });
      return;
    }

    setMetaAccessToken("");
    setDashboardPassword("");
    setData((prev) =>
      prev ? { ...prev, settings: json.settings } : prev
    );
    setMessage({ type: "ok", text: "Configuración guardada correctamente" });
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-400" style={style}>
        Cargando…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div style={style}>
        <AdminLoginGate
          clientName={client.name}
          onSuccess={() => {
            setAuthenticated(true);
            loadSettings();
          }}
        />
      </div>
    );
  }

  const s = data?.settings;

  return (
    <div className="min-h-screen" style={style}>
      <AppHeader
        client={client}
        active="settings"
        campaignsEnabled={
          data?.settings.widgetConfig
            ? data.settings.widgetConfig.features?.campaignsEnabled !== false
            : true
        }
        availableClients={availableClients}
        isAdmin
      />

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {!s?.supabaseReady && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">Supabase no configurado en Vercel</p>
            <p className="mt-1 text-amber-800">
              Agregá <code className="text-xs">SUPABASE_URL</code> y{" "}
              <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> para guardar
              desde la web. Sin eso, solo funcionan las variables de entorno.
            </p>
          </div>
        )}

        {s?.configured && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            API configurada
            {s.metaAccessTokenHint && (
              <span className="ml-1 text-green-700">
                · Token {s.metaAccessTokenHint}
              </span>
            )}
            {s.source === "env" && (
              <span className="ml-1 text-green-700">· desde variables de entorno</span>
            )}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Token de Meta (access token)
            </label>
            <p className="mt-0.5 text-xs text-gray-400">
              Permisos <code>ads_read</code> + <code>ads_management</code>.
              Pegá solo el token (empieza con EAA…), sin comillas ni espacios.
              Dejá vacío para mantener el actual.
            </p>
            <input
              type="password"
              value={metaAccessToken}
              onChange={(e) => setMetaAccessToken(e.target.value)}
              placeholder={
                s?.metaAccessTokenSet
                  ? `Token guardado ${s.metaAccessTokenHint || ""}`
                  : "Pegá el token aquí"
              }
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[var(--client-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cuenta y página de Meta
            </label>
            <p className="mt-0.5 text-xs text-gray-400">
              Se cargan desde tu token. Elegí en el listado — no hace falta copiar IDs.
            </p>
            <div className="mt-2">
              <MetaAssetPicker
                token={metaAccessToken}
                adAccountId={metaAdAccountId}
                onAdAccountIdChange={setMetaAdAccountId}
                pageId={metaPageId}
                onPageIdChange={setMetaPageId}
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contraseña del dashboard (opcional)
            </label>
            <p className="mt-0.5 text-xs text-gray-400">
              Protege la vista del cliente. Dejá vacío para no cambiar
              {s?.dashboardPasswordSet ? " (ya hay una configurada)" : ""}.
            </p>
            <input
              type="password"
              value={dashboardPassword}
              onChange={(e) => setDashboardPassword(e.target.value)}
              placeholder="Nueva contraseña"
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[var(--client-primary)]"
            />
          </div>

          {message && (
            <p
              className={`text-sm ${message.type === "ok" ? "text-green-600" : "text-red-600"}`}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={saving || !s?.supabaseReady}
            className="w-full rounded-xl bg-[var(--client-primary)] py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar configuración"}
          </button>
        </form>

        {s?.widgetConfig && (
          <div className="mt-8">
            <WidgetEditor
              config={s.widgetConfig}
              disabled={!s.supabaseReady}
              onSave={async (widgetConfig) => {
                const res = await fetch("/api/widgets", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ widgetConfig }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || "Error");
                setData((prev) =>
                  prev
                    ? {
                        ...prev,
                        settings: { ...prev.settings, widgetConfig: json.widgetConfig },
                      }
                    : prev
                );
              }}
            />
          </div>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          La contraseña de admin (<code>ADMIN_PASSWORD</code>) solo va en Vercel, no se guarda en la base.
        </p>
      </main>
    </div>
  );
}
