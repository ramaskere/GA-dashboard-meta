"use client";

import {
  BUDGET_LEVEL_OPTIONS,
  type BudgetLevel,
} from "@/lib/adset-segmentation";

const fieldCls =
  "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--client-primary)]";

interface BudgetFieldsProps {
  level: BudgetLevel;
  onLevelChange: (level: BudgetLevel) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  currency: string;
  showLevelToggle?: boolean;
  disabled?: boolean;
  campaignHasBudget?: boolean;
  /** En pestaña solo campaña: ABO no pide monto acá */
  adSetBudgetLater?: boolean;
  /** En pestaña ad set: CBO solo aplica al crear la campaña, no acá */
  onlyAdSetLevel?: boolean;
}

export function BudgetFields({
  level,
  onLevelChange,
  amount,
  onAmountChange,
  currency,
  showLevelToggle = true,
  disabled,
  campaignHasBudget,
  adSetBudgetLater,
  onlyAdSetLevel,
}: BudgetFieldsProps) {
  const options = onlyAdSetLevel
    ? BUDGET_LEVEL_OPTIONS.filter((o) => o.value === "adset")
    : BUDGET_LEVEL_OPTIONS;
  const selectedHint = options.find((o) => o.value === level)?.hint;

  return (
    <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Presupuesto diario
      </p>

      {onlyAdSetLevel && !campaignHasBudget && (
        <p className="text-xs text-gray-500">
          Esta campaña no tiene CBO. El presupuesto va en el <strong>ad set</strong> (ABO).
          Para CBO, creala en la pestaña Campaña con presupuesto en campaña.
        </p>
      )}

      {showLevelToggle && !onlyAdSetLevel && (
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onLevelChange(opt.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                level === opt.value
                  ? "border-[var(--client-primary)] bg-blue-50 text-[var(--client-primary)]"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {selectedHint && (
        <p className="text-xs text-gray-500">{selectedHint}</p>
      )}

      {campaignHasBudget && level === "adset" && (
        <p className="text-xs text-amber-700">
          La campaña elegida ya tiene presupuesto (CBO). No hace falta definirlo en el ad set.
        </p>
      )}

      {adSetBudgetLater && level === "adset" && (
        <p className="text-xs text-gray-500">
          Con ABO el presupuesto se define en la pestaña <strong>Ad set</strong>.
        </p>
      )}

      {(level === "campaign" ||
        (level === "adset" && !campaignHasBudget && !adSetBudgetLater)) && (
        <>
          <input
            required={!campaignHasBudget || level === "campaign"}
            type="number"
            min={1}
            step={1}
            disabled={disabled}
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder={`Monto en ${currency}`}
            className={fieldCls}
          />
          <p className="text-xs text-gray-400">
            Monto en <strong>{currency}</strong> por día (moneda de la cuenta Meta).
            Meta aplica un mínimo según el país y objetivo.
          </p>
        </>
      )}
    </div>
  );
}
