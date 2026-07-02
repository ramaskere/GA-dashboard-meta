"use client";

import { useCallback, useEffect, useState } from "react";

interface AdAccountOption {
  id: string;
  name: string;
  account_id: string;
  currency?: string;
  account_status?: number;
}

interface PageOption {
  id: string;
  name: string;
}

interface MetaAssetPickerProps {
  token?: string;
  adAccountId: string;
  onAdAccountIdChange: (id: string) => void;
  pageId: string;
  onPageIdChange: (id: string) => void;
  showPage?: boolean;
  /** Solo selector de página (usa adAccountId para cargar) */
  pagesOnly?: boolean;
  disabled?: boolean;
}

const fieldCls =
  "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[var(--client-primary)]";

export function MetaAssetPicker({
  token,
  adAccountId,
  onAdAccountIdChange,
  pageId,
  onPageIdChange,
  showPage = true,
  pagesOnly = false,
  disabled,
}: MetaAssetPickerProps) {
  const [adAccounts, setAdAccounts] = useState<AdAccountOption[]>([]);
  const [pages, setPages] = useState<PageOption[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingPages, setLoadingPages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAdAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    setError(null);
    try {
      const res = await fetch("/api/meta-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token?.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No se pudieron cargar las cuentas");
        return;
      }
      setAdAccounts(json.adAccounts || []);
    } catch {
      setError("Error de conexión al cargar cuentas de Meta");
    } finally {
      setLoadingAccounts(false);
    }
  }, [token]);

  const loadPages = useCallback(
    async (accountId: string) => {
      if (!accountId) {
        setPages([]);
        return;
      }
      setLoadingPages(true);
      try {
        const res = await fetch("/api/meta-options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: token?.trim() || undefined,
            adAccountId: accountId,
          }),
        });
        const json = await res.json();
        if (res.ok) {
          setPages(json.pages || []);
        }
      } catch {
        // pages optional
      } finally {
        setLoadingPages(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadAdAccounts();
  }, [loadAdAccounts]);

  useEffect(() => {
    if (adAccountId && (showPage || pagesOnly)) loadPages(adAccountId);
  }, [adAccountId, loadPages, showPage, pagesOnly]);

  const loading = loadingAccounts || loadingPages;
  const selectedAccount = adAccounts.find((a) => a.id === adAccountId);

  const pageBlock = showPage || pagesOnly ? (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Página de Facebook
      </label>
      <p className="mt-0.5 text-xs text-gray-400">
        {pagesOnly
          ? "Elegí la página que publica el anuncio."
          : "Para publicar anuncios. Se preselecciona al crear creativos."}
      </p>
      {pages.length > 0 ? (
        <select
          required
          disabled={disabled || loadingPages || !adAccountId}
          value={pageId}
          onChange={(e) => onPageIdChange(e.target.value)}
          className={`mt-2 ${fieldCls}`}
        >
          <option value="">Elegí página</option>
          {pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      ) : (
        <input
          disabled={disabled || !adAccountId}
          value={pageId}
          onChange={(e) => onPageIdChange(e.target.value)}
          placeholder="Page ID (si no aparece en la lista)"
          className={`mt-2 ${fieldCls}`}
        />
      )}
      {pageId && (
        <p className="mt-1 text-xs text-gray-400">
          ID: <code>{pageId}</code>
        </p>
      )}
    </div>
  ) : null;

  if (pagesOnly) {
    return <div className="space-y-2">{pageBlock}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Cuentas de Meta
        </p>
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => {
            loadAdAccounts();
            if (adAccountId) loadPages(adAccountId);
          }}
          className="text-xs font-medium text-[var(--client-primary)] hover:underline disabled:opacity-50"
        >
          {loading ? "Cargando…" : "↻ Actualizar"}
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {adAccounts.length > 0 ? (
        <select
          required
          disabled={disabled || loadingAccounts}
          value={adAccountId}
          onChange={(e) => onAdAccountIdChange(e.target.value)}
          className={fieldCls}
        >
          <option value="">Elegí cuenta publicitaria</option>
          {adAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
              {a.currency ? ` · ${a.currency}` : ""}
              {a.account_status !== 1 ? " · inactiva" : ""}
            </option>
          ))}
        </select>
      ) : (
        <input
          required
          disabled={disabled}
          value={adAccountId}
          onChange={(e) => onAdAccountIdChange(e.target.value)}
          placeholder="act_123456789 (o actualizá con token válido)"
          className={fieldCls}
        />
      )}

      {selectedAccount && (
        <p className="text-xs text-gray-400">
          ID guardado: <code>{selectedAccount.id}</code>
        </p>
      )}

      {showPage && !pagesOnly && pageBlock}
    </div>
  );
}
