"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDateLabel } from "@/lib/format";

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
