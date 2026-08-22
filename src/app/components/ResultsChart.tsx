import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CountBar } from "../results/summary";

export function ResultsChart({
  chartData,
  iterations,
}: {
  chartData: CountBar[];
  iterations: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="text-[1.1rem] text-foreground">
        Chance of this many or more low scores by chance
      </h2>
      <p className="mb-4 text-[0.85rem] text-muted-foreground">
        How often a healthy person would show at least this number of low
        scores across {iterations.toLocaleString()} simulations.
      </p>
      <div className="h-[340px] w-full">
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 24, right: 8, left: 4, bottom: 24 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              label={{
                value: "Number of abnormally low scores or more",
                position: "insideBottom",
                offset: -14,
                fill: "var(--muted-foreground)",
                fontSize: 12,
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickFormatter={(v) => `${v}%`}
              label={{
                value: "Probability",
                angle: -90,
                position: "insideLeft",
                fill: "var(--muted-foreground)",
                fontSize: 12,
              }}
            />
            <Tooltip
              animationDuration={0}
              cursor={{ fill: "var(--accent)", opacity: 0.4 }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--border)",
                fontSize: 13,
              }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, "Probability"]}
              labelFormatter={(l) => `${l} or more low score${l === "1" ? "" : "s"}`}
            />
            <Bar dataKey="atLeastPct" radius={[3, 3, 0, 0]} maxBarSize={64} isAnimationActive={false}>
              {chartData.map((d) => (
                <Cell key={`cell-${d.k}`} fill="var(--chart-1)" />
              ))}
              <LabelList
                dataKey="atLeastPct"
                position="top"
                formatter={(v: number) => (v >= 0.5 ? `${v.toFixed(0)}%` : "")}
                style={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
