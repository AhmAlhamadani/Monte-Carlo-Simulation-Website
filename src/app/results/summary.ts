import type { SimulationResult } from "../lib/monte-carlo";

export type CountBar = {
  k: number;
  label: string;
  pct: number;
  atLeastPct: number;
};

export function formatPct(n: number) {
  return n >= 10 ? n.toFixed(0) : n >= 1 ? n.toFixed(1) : n.toFixed(2);
}

export function summariseResults(result: SimulationResult) {
  const data: CountBar[] = result.distribution.map((p, k) => ({
    k,
    label: String(k),
    pct: p * 100,
    atLeastPct: result.atLeast[k] * 100,
  }));

  return {
    data,
    chartData: data.filter((d) => d.k >= 1),
    mostLikely: data.reduce((a, b) => (b.pct > a.pct ? b : a), data[0]),
    oneOrMore: (result.atLeast[1] ?? 0) * 100,
    twoOrMore: (result.atLeast[2] ?? 0) * 100,
  };
}
