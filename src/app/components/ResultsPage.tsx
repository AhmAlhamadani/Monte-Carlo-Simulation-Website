import { Check, Cloud, Pencil, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { ResultsChart } from "./ResultsChart";
import type { Analysis } from "../types";
import type { SimulationResult } from "../lib/monte-carlo";
import { formatPct, summariseResults } from "../results/summary";

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
  const { chartData, mostLikely, oneOrMore, twoOrMore } = summariseResults(result);

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
          big={`${formatPct(oneOrMore)}%`}
          caption="chance of 1 or more low scores by chance"
        />
        <SummaryCard
          big={`${formatPct(twoOrMore)}%`}
          caption="chance of 2 or more low scores by chance"
        />
        <SummaryCard
          big={`${mostLikely.k}`}
          caption={`most likely count (${formatPct(mostLikely.pct)}% of the time)`}
        />
      </div>

      <ResultsChart chartData={chartData} iterations={result.iterations} />

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
