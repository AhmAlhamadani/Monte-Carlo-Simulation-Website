// Monte Carlo engine for estimating the number of abnormally low scores
// expected to occur by chance within a correlated test battery.
//
// Approach (after Crawford, Garthwaite & Gault): draw a large number of
// samples from a multivariate normal distribution with the user-supplied
// correlation matrix, count how many scores fall below the abnormality
// threshold in each draw, then tabulate the resulting distribution.

import jStat from "jstat";
import { CholeskyDecomposition, Matrix } from "ml-matrix";

// Cholesky with progressive jitter so hand-entered correlation matrices that
// are only marginally non-positive-definite still yield a usable factor.
function choleskyWithJitter(correlation: number[][]): Matrix {
  const n = correlation.length;
  let matrix = correlation.map((row) => row.slice());

  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const chol = new CholeskyDecomposition(new Matrix(matrix));
      if (chol.isPositiveDefinite()) {
        return chol.lowerTriangularMatrix;
      }
    } catch {
      /* matrix may be invalid — retry with jitter */
    }

    const jitter = Math.pow(10, attempt - 6);
    for (let i = 0; i < n; i++) matrix[i][i] += jitter;
  }

  // Fallback: treat tests as independent.
  return Matrix.eye(n, n);
}

export interface SimulationResult {
  distribution: number[];
  atLeast: number[];
  threshold: number;
  iterations: number;
}

export function runSimulation(
  correlation: number[][],
  percentile: number,
  iterations = 20000,
): SimulationResult {
  const n = correlation.length;
  const zCut = jStat.normal.inv(percentile / 100, 0, 1);
  const L = choleskyWithJitter(correlation);
  const counts = new Array(n + 1).fill(0);

  for (let iter = 0; iter < iterations; iter++) {
    const z = Matrix.columnVector(
      Array.from({ length: n }, () => jStat.randn() as number),
    );
    const x = L.mmul(z);

    let abnormal = 0;
    for (let i = 0; i < n; i++) {
      if (x.get(i, 0) < zCut) abnormal++;
    }
    counts[abnormal]++;
  }

  const distribution = counts.map((c) => c / iterations);
  const atLeast = new Array(n + 1).fill(0);
  let cum = 0;
  for (let k = n; k >= 0; k--) {
    cum += distribution[k];
    atLeast[k] = cum;
  }

  return { distribution, atLeast, threshold: zCut, iterations };
}
