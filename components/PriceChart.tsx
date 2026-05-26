"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HistoricalChartPoint } from "@/types/crypto";

interface PriceChartProps {
  symbol: string;
  data: HistoricalChartPoint[];
}

function formatValue(value: number) {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }

  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 3 })}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export default function PriceChart({ symbol, data }: PriceChartProps) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10 sm:p-6 lg:col-span-2">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
          Price Chart
        </p>
        <h2 className="mt-2 text-lg font-semibold">
          {symbol} 30-day price history
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Historical market context used to calculate realized volatility.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex h-72 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/30 text-sm text-slate-400">
          Historical price data is currently unavailable.
        </div>
      ) : (
      <div className="h-72 w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 800, height: 288 }}
        >
          <LineChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: -12 }}>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickFormatter={formatDate}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickFormatter={formatValue}
              width={62}
              domain={["dataMin", "dataMax"]}
            />
            <Tooltip
              formatter={(value) => [formatValue(Number(value)), "Price"]}
              labelFormatter={(label) => formatDate(String(label))}
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "12px",
                color: "#e2e8f0",
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#22d3ee"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, fill: "#22d3ee" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      )}
    </section>
  );
}
