import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runSimulation, type SimulationResult } from "../src/app/lib/monte-carlo";

const ITERATIONS = 15000;

function identity(n: number) {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );
}

function equalCorrelation(n: number, r: number) {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : r)),
  );
}

function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function expectValidOutput(result: SimulationResult, n: number) {
  expect(result.iterations).toBe(ITERATIONS);
  expect(result.distribution).toHaveLength(n + 1);
  expect(result.atLeast).toHaveLength(n + 1);
  expect(result.distribution.reduce((sum, p) => sum + p, 0)).toBeCloseTo(1, 10);
  expect(result.atLeast[0]).toBeCloseTo(1, 10);

  for (const p of result.distribution) {
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
  }
  for (let k = 1; k <= n; k++) {
    expect(result.atLeast[k]).toBeLessThanOrEqual(result.atLeast[k - 1] + 1e-12);
  }
}

describe("runSimulation", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockImplementation(mulberry32(20260905));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns valid probabilities for one test at the 5th percentile", () => {
    const result = runSimulation(identity(1), 5, ITERATIONS);

    expectValidOutput(result, 1);
    expect(result.threshold).toBeCloseTo(-1.64485, 4);
    expect(result.distribution[1]).toBeGreaterThan(0.03);
    expect(result.distribution[1]).toBeLessThan(0.07);
    expect(result.atLeast[1]).toBeCloseTo(result.distribution[1], 10);
  });

  it("matches the independent-tests base rate for k ≥ 1", () => {
    const result = runSimulation(identity(2), 5, ITERATIONS);
    const expectedAtLeastOne = 1 - 0.95 ** 2;

    expectValidOutput(result, 2);
    expect(result.atLeast[1]).toBeGreaterThan(expectedAtLeastOne - 0.02);
    expect(result.atLeast[1]).toBeLessThan(expectedAtLeastOne + 0.02);
  });

  it("clusters abnormalities when tests are highly correlated", () => {
    const independent = runSimulation(identity(3), 5, ITERATIONS);
    const correlated = runSimulation(equalCorrelation(3, 0.9), 5, ITERATIONS);

    expectValidOutput(independent, 3);
    expectValidOutput(correlated, 3);
    expect(correlated.atLeast[1]).toBeLessThan(independent.atLeast[1]);
    expect(correlated.distribution[3]).toBeGreaterThan(independent.distribution[3]);
  });

  it("finds fewer abnormal results at a stricter percentile", () => {
    const corr = identity(2);
    const first = runSimulation(corr, 1, ITERATIONS);
    const sixteenth = runSimulation(corr, 16, ITERATIONS);

    expect(first.atLeast[1]).toBeLessThan(sixteenth.atLeast[1]);
  });
});
