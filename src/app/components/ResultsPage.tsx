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
import { Check, Cloud, Pencil, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import type { Analysis } from "../types";
import type { SimulationResult } from "../lib/monte-carlo";

export function ResultsPage({
  analysis,
  result,
  saved,
  onNew,
  onEdit,
}: {
  analysis: Analysis;
  result: SimulationResult;
  saved: boolean;
  onNew: () => void;
  onEdit: () => void;
}) {
  const data = result.distribution.map((p, k) => ({
    k,
    label: String(k),
    pct: p * 100,
    atLeastPct: result.atLeast[k] * 100,
  }));

  const mostLikely = data.reduce((a, b) => (b.pct > a.pct ? b : a), data[0]);
  const oneOrMore = (result.atLeast[1] ?? 0) * 100;
  const twoOrMore = (result.atLeast[2] ?? 0) * 100;

  const fmt = (n: number) =>
    n >= 10 ? n.toFixed(0) : n >= 1 ? n.toFixed(1) : n.toFixed(2);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
        <h1 className="text-[1.9rem] text-foreground">
            Results
          </h1>
          <p className="mt-1 text-muted-foreground">
            {analysis.name ? (
              <span className="font-semibold text-foreground">
                {analysis.name}
              </span>
            ) : (
              "Untitled analysis"
            )}
          </p>
        </div>
        {saved ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-[0.85rem] text-muted-foreground">
            <Check className="size-4 text-primary" />
            Auto-saved
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-border px-3 py-1.5 text-[0.85rem] text-muted-foreground">
            <Cloud className="size-4" />
            Saving…
          </span>
        )}
      </header>

      <div className="mb-5 flex flex-wrap gap-2">
        <Chip label="Threshold" value={`${analysis.percentile}th percentile`} />
        <Chip label="z cut-off" value={result.threshold.toFixed(2)} />
        <Chip label="Tests" value={String(analysis.numTests)} />
        <Chip label="Simulations" value={result.iterations.toLocaleString()} />
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <SummaryCard
          big={`${fmt(oneOrMore)}%`}
          caption="chance of 1 or more low scores by chance"
        />
        <SummaryCard
          big={`${fmt(twoOrMore)}%`}
          caption="chance of 2 or more low scores by chance"
        />
        <SummaryCard
          big={`${mostLikely.k}`}
          caption={`most likely count (${fmt(mostLikely.pct)}% of the time)`}
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="text-[1.1rem] text-foreground">
          Distribution of abnormally low scores expected by chance
        </h2>
        <p className="mb-4 text-[0.85rem] text-muted-foreground">
          How often a healthy person would show each number of low scores across{" "}
          {result.iterations.toLocaleString()} simulations.
        </p>
        <div className="h-[340px] w-full">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 24, right: 8, left: 4, bottom: 24 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                label={{
                  value: "Number of abnormally low scores",
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
                formatter={(value: number, _n, item: any) => [
                  `${value.toFixed(2)}%  (${item.payload.atLeastPct.toFixed(1)}% for ${item.payload.k} or more)`,
                  "Probability",
                ]}
                labelFormatter={(l) => `${l} low score${l === "1" ? "" : "s"}`}
              />
              <Bar dataKey="pct" radius={[3, 3, 0, 0]} maxBarSize={64} isAnimationActive={false}>
                {data.map((d) => (
                  <Cell
                    key={`cell-${d.k}`}
                    fill={d.k === 0 ? "var(--chart-3)" : "var(--chart-1)"}
                  />
                ))}
                <LabelList
                  dataKey="pct"
                  position="top"
                  formatter={(v: number) => (v >= 0.5 ? `${v.toFixed(0)}%` : "")}
                  style={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {analysis.notes && (
        <div className="mt-4 rounded-lg border border-border bg-card p-4 text-[0.9rem] shadow-sm">
          <span className="text-muted-foreground">Notes: </span>
          {analysis.notes}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" size="lg" className="gap-2" onClick={onEdit}>
          <Pencil className="size-4" /> Edit inputs
        </Button>
        <Button size="lg" className="gap-2" onClick={onNew}>
          <RotateCcw className="size-4" /> Start new analysis
        </Button>
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[0.8rem]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">
        {value}
      </span>
    </span>
  );
}

function SummaryCard({ big, caption }: { big: string; caption: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="text-[1.9rem] font-bold text-primary">
        {big}
      </div>
      <div className="mt-1 text-[0.85rem] text-muted-foreground">{caption}</div>
    </div>
  );
}

export type { SimulationResult };
