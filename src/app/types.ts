import type { SimulationResult } from "./lib/monte-carlo";

export interface Analysis {
  id: string;
  name: string;
  notes: string;
  percentile: number;
  numTests: number;
  testNames: string[];
  correlations: (number | null)[][];
  createdAt: number;
  updatedAt?: number;
}

export interface SavedRun extends Analysis {
  result: SimulationResult | null;
}

export const PERCENTILE_OPTIONS = [
  { value: 1, label: "1st percentile", desc: "Very conservative (z ≈ −2.33)" },
  { value: 2, label: "2nd percentile", desc: "Conservative (z ≈ −2.05)" },
  { value: 5, label: "5th percentile", desc: "Common clinical cut-off (z ≈ −1.64)" },
  { value: 10, label: "10th percentile", desc: "Lenient (z ≈ −1.28)" },
  { value: 16, label: "16th percentile", desc: "1 SD below mean (z ≈ −1.00)" },
];
