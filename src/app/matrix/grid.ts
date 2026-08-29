export interface MatrixData {
  testNames: string[];
  correlations: (number | null)[][];
}

export function cellKey(r: number, c: number) {
  return `${r}-${c}`;
}

export function defaultTestNames(numTests: number, initialNames: string[]) {
  return Array.from({ length: numTests }, (_, i) => initialNames[i] ?? `Test ${i + 1}`);
}

export function initialValueGrid(
  numTests: number,
  initialCorrelations: (number | null)[][],
) {
  return Array.from({ length: numTests }, (_, r) =>
    Array.from({ length: numTests }, (_, c) =>
      c < r && initialCorrelations[r]?.[c] != null
        ? String(initialCorrelations[r][c])
        : "",
    ),
  );
}

export function emptyValueGrid(numTests: number) {
  return Array.from({ length: numTests }, () =>
    Array.from({ length: numTests }, () => ""),
  );
}

export function lowerTriangleCells(numTests: number): [number, number][] {
  const list: [number, number][] = [];
  for (let r = 1; r < numTests; r++)
    for (let c = 0; c < r; c++) list.push([r, c]);
  return list;
}

export type MatrixDirection = "up" | "down" | "left" | "right";

export type MatrixFocus =
  | { kind: "name"; r: number }
  | { kind: "cell"; r: number; c: number };

export function neighborFocus(
  from: MatrixFocus,
  dir: MatrixDirection,
  numTests: number,
): MatrixFocus | null {
  if (from.kind === "name") {
    if (dir === "up") return from.r > 0 ? { kind: "name", r: from.r - 1 } : null;
    if (dir === "down") return from.r + 1 < numTests ? { kind: "name", r: from.r + 1 } : null;
    if (dir === "right") return from.r > 0 ? { kind: "cell", r: from.r, c: 0 } : null;
    return null;
  }

  const { r, c } = from;
  if (dir === "left") {
    return c > 0 ? { kind: "cell", r, c: c - 1 } : { kind: "name", r };
  }
  if (dir === "right") return c + 1 < r ? { kind: "cell", r, c: c + 1 } : null;
  if (dir === "up") return r - 1 > c ? { kind: "cell", r: r - 1, c } : null;
  return r + 1 < numTests ? { kind: "cell", r: r + 1, c } : null;
}

export function isValidCorrelation(v: string) {
  if (v.trim() === "") return true;
  const n = Number(v);
  return !isNaN(n) && n >= -1 && n <= 1;
}

export function valuesFromMatrix(numTests: number, matrix: number[][], formatCorr: (n: number) => string) {
  return Array.from({ length: numTests }, (_, r) =>
    Array.from({ length: numTests }, (_, c) =>
      c < r ? formatCorr(matrix[r][c]) : "",
    ),
  );
}

export function collectMatrix(
  numTests: number,
  names: string[],
  values: string[][],
  cellOrder: [number, number][],
): { ok: true; data: MatrixData } | { ok: false; error: string } {
  const missing: string[] = [];
  const invalid: string[] = [];
  const corr: number[][] = Array.from({ length: numTests }, () =>
    new Array(numTests).fill(0),
  );
  for (let i = 0; i < numTests; i++) corr[i][i] = 1;

  for (const [r, c] of cellOrder) {
    const v = values[r][c];
    if (v.trim() === "") {
      missing.push(`${names[r]} × ${names[c]}`);
      continue;
    }
    if (!isValidCorrelation(v)) {
      invalid.push(`${names[r]} × ${names[c]}`);
      continue;
    }
    const n = Number(v);
    corr[r][c] = n;
    corr[c][r] = n;
  }

  if (invalid.length) {
    return {
      ok: false,
      error: `${invalid.length} value(s) are outside the −1.0 to 1.0 range. Please correct them.`,
    };
  }
  if (missing.length) {
    return {
      ok: false,
      error: `${missing.length} correlation(s) still need a value before you can run the analysis.`,
    };
  }
  return {
    ok: true,
    data: {
      testNames: names,
      correlations: corr,
    },
  };
}

export function isMatrixComplete(
  corr: (number | null)[][],
  numTests: number,
) {
  if (corr.length !== numTests) return false;
  for (let r = 1; r < numTests; r++) {
    for (let c = 0; c < r; c++) {
      const v = corr[r]?.[c];
      if (v == null || Number.isNaN(v)) return false;
    }
  }
  return true;
}

export function buildPartial(values: string[][], n: number): (number | null)[][] {
  const corr: (number | null)[][] = Array.from({ length: n }, () =>
    new Array(n).fill(null),
  );
  for (let i = 0; i < n; i++) corr[i][i] = 1;
  for (let r = 1; r < n; r++)
    for (let c = 0; c < r; c++) {
      const v = values[r][c];
      if (v.trim() !== "" && !isNaN(Number(v))) {
        corr[r][c] = Number(v);
        corr[c][r] = Number(v);
      }
    }
  return corr;
}
