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
    <section className="rounded-2xl border border-white/50 bg-white/40 p-5 shadow-xl shadow-slate-200/30 backdrop-blur-xl sm:p-6 lg:col-span-2">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">
          Price Chart
        </p>
        <h2 className="mt-2 text-lg font-semibold text-slate-800">
          {symbol} recent price history
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Historical market context used for realized volatility and technical indicators.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex h-72 items-center justify-center rounded-xl border border-slate-300/40 bg-white/30 text-sm text-slate-600 backdrop-blur-xl">
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
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickFormatter={formatDate}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickFormatter={formatValue}
              width={62}
              domain={["dataMin", "dataMax"]}
            />
            <Tooltip
              formatter={(value) => [formatValue(Number(value)), "Price"]}
              labelFormatter={(label) => formatDate(String(label))}
              contentStyle={{
                background: "rgba(255, 255, 255, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.5)",
                borderRadius: "16px",
                color: "#1e293b",
                backdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="url(#priceGradient)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: "#007aff" }}
            />
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#007aff" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#5856d6" stopOpacity={0.8} />
              </linearGradient>
            </defs>
          </LineChart>
        </ResponsiveContainer>
      </div>
      )}
    </section>
  );
}
