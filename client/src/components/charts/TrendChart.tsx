"use client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";
import { formatValue } from "@/lib/filters";
import type { RegionTrendSeries } from "@/lib/types";
export default function TrendChart({
  series,
  unit,
  year,
}: {
  series: RegionTrendSeries[];
  unit: string;
  year: number | null;
}) {
  const years = [
    ...new Set(series.flatMap((s) => s.data.map((p) => p.year))),
  ].sort((a, b) => a - b);
  const continuousYears = years.length
    ? Array.from(
        { length: years[years.length - 1] - years[0] + 1 },
        (_, index) => years[0] + index,
      )
    : [];
  const data = continuousYears.map((y) =>
    Object.fromEntries([
      ["year", y],
      ...series.map((s) => [
        s.COD_DPTO,
        s.data.find((p) => p.year === y)?.value ?? null,
      ]),
    ]),
  );
  if (!series.some((s) => s.data.some((p) => p.value !== null)))
    return (
      <p className="gp-message">No hay serie histórica para esta selección.</p>
    );
  return (
    <div className="h-80 min-w-0" aria-label={`Serie histórica en ${unit}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 16, right: 20, bottom: 8, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="year" />
          <YAxis width={65} tickFormatter={(v) => formatValue(Number(v))} />
          <Tooltip
            formatter={(v) => formatValue(v == null ? null : Number(v), unit)}
          />
          <Legend />
          <ReferenceLine
            x={year ?? undefined}
            stroke="#64748b"
            strokeDasharray="4 4"
          />
          {series.map((s, i) => (
            <Line
              key={s.COD_DPTO}
              name={s.NOM_DPTO}
              dataKey={s.COD_DPTO}
              stroke={i === 0 ? "#0f766e" : "#2563eb"}
              strokeWidth={2}
              connectNulls={false}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
