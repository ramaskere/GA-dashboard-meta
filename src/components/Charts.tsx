"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDateLabel } from "@/lib/format";
import { daysInMonth } from "@/lib/months";

interface DailyPoint {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
}

interface SpendChartProps {
  data: DailyPoint[];
  currency: string;
  locale: string;
}

function formatMoney(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function SpendChart({ data, currency, locale }: SpendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        Sin datos para el período seleccionado
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--client-primary)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--client-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => formatDateLabel(d, locale)}
          tick={{ fontSize: 11, fill: "#86868b" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatMoney(v, currency, locale)}
          tick={{ fontSize: 11, fill: "#86868b" }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip
          formatter={(value: number) => [formatMoney(value, currency, locale), "Gasto"]}
          labelFormatter={(label) => formatDateLabel(String(label), locale)}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e5e5e5",
            fontSize: 13,
          }}
        />
        <Area
          type="monotone"
          dataKey="spend"
          stroke="var(--client-primary)"
          strokeWidth={2}
          fill="url(#spendGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ClicksChart({ data, locale }: { data: DailyPoint[]; locale: string }) {
  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => formatDateLabel(d, locale)}
          tick={{ fontSize: 10, fill: "#86868b" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#86868b" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          labelFormatter={(label) => formatDateLabel(String(label), locale)}
          contentStyle={{ borderRadius: 12, border: "1px solid #e5e5e5", fontSize: 13 }}
        />
        <Bar dataKey="clicks" fill="var(--client-primary)" radius={[4, 4, 0, 0]} opacity={0.85} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface CumulativePoint {
  date: string;
  spend: number;
  cumulative: number;
  projected: number;
}

interface CumulativeSpendChartProps {
  data: Array<{ date: string; spend: number }>;
  monthKey: string;
  spendGoal?: number;
  currency: string;
  locale: string;
}

export function CumulativeSpendChart({
  data,
  monthKey,
  spendGoal,
  currency,
  locale,
}: CumulativeSpendChartProps) {
  const totalDays = daysInMonth(monthKey);
  let running = 0;

  const chartData: CumulativePoint[] = data.map((row, idx) => {
    running += row.spend;
    const dayNum = idx + 1;
    const projected =
      spendGoal && spendGoal > 0
        ? (spendGoal / totalDays) * dayNum
        : 0;
    return {
      date: row.date,
      spend: row.spend,
      cumulative: running,
      projected,
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        Sin datos para el período seleccionado
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => formatDateLabel(d, locale)}
          tick={{ fontSize: 11, fill: "#86868b" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatMoney(v, currency, locale)}
          tick={{ fontSize: 11, fill: "#86868b" }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            const labels: Record<string, string> = {
              cumulative: "Acumulado",
              projected: "Meta proyectada",
            };
            return [formatMoney(value, currency, locale), labels[name] || name];
          }}
          labelFormatter={(label) => formatDateLabel(String(label), locale)}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e5e5e5",
            fontSize: 13,
          }}
        />
        {spendGoal && spendGoal > 0 && (
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) =>
              value === "projected" ? "Ritmo meta" : "Gasto acumulado"
            }
          />
        )}
        <Area
          type="monotone"
          dataKey="cumulative"
          name="cumulative"
          stroke="var(--client-primary)"
          strokeWidth={2}
          fill="var(--client-primary)"
          fillOpacity={0.12}
        />
        {spendGoal && spendGoal > 0 && (
          <Line
            type="monotone"
            dataKey="projected"
            name="projected"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
