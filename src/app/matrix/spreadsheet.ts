export type SpreadsheetParseResult =
  | { size: number; names: string[] | null; matrix: number[][] }
  | { error: string };

export function looksLikeSpreadsheet(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (t.includes("\t")) return true;
  if (t.includes("\n") && t.split(/\r?\n/).filter((l) => l.trim()).length >= 2) {
    return true;
  }
  if (t.includes(";") && t.split(";").length >= 3) return true;
  return false;
}

export function parseSpreadsheetMatrix(text: string): SpreadsheetParseResult {
  const grid = splitSpreadsheet(text);
  if (grid.length < 2) {
    return {
      error:
        "Could not read a correlation matrix from the paste. Copy a block of cells from a spreadsheet.",
    };
  }

  const { names, body } = stripHeaders(grid);
  const size = body.length;
  if (size < 2) {
    return {
      error:
        "The pasted spreadsheet needs at least 2 tests. Check that you copied the full matrix.",
    };
  }

  const nums = body.map((row) => row.map(parseNumber));
  const matrix: number[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => NaN),
  );

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const v = nums[i]?.[j];
      if (v !== null && v !== undefined) matrix[i][j] = v;
    }
  }

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < i; j++) {
      if (!Number.isFinite(matrix[i][j]) && Number.isFinite(matrix[j][i])) {
        matrix[i][j] = matrix[j][i];
      }
      if (!Number.isFinite(matrix[j][i]) && Number.isFinite(matrix[i][j])) {
        matrix[j][i] = matrix[i][j];
      }
    }
    if (!Number.isFinite(matrix[i][i])) matrix[i][i] = 1;
  }

  for (let i = 1; i < size; i++) {
    for (let j = 0; j < i; j++) {
      if (!Number.isFinite(matrix[i][j])) {
        return {
          error:
            "Could not read a complete correlation matrix from the pasted spreadsheet.",
        };
      }
      if (matrix[i][j] < -1 || matrix[i][j] > 1) {
        return {
          error: `Pasted value ${matrix[i][j]} is outside the −1.0 to 1.0 range.`,
        };
      }
    }
  }

  const cleanNames =
    names && names.length >= size
      ? names.slice(0, size)
      : names && names.length === size
        ? names
        : null;

  return { size, names: cleanNames, matrix };
}

export function formatCorr(n: number): string {
  const rounded = Math.round(n * 1e6) / 1e6;
  return String(rounded);
}

function parseNumber(raw: string): number | null {
  let s = raw.trim().replace(/^["']|["']$/g, "").replace(/\u00a0/g, " ").trim();
  if (s === "" || s === "—" || s === "–" || s === "-") return null;
  s = s.replace(/[%*†‡§]+/g, "").trim();
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) {
    s = s.replace(/,/g, "");
  } else if (/^-?\d+,\d+$/.test(s)) {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

function splitSpreadsheet(text: string): string[][] {
  const nonempty = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\u00a0/g, " ").trimEnd())
    .filter((l) => l.trim() !== "");

  const tabCount = nonempty.filter((l) => l.includes("\t")).length;
  if (tabCount >= 1) {
    return nonempty.map((l) => l.split("\t").map((c) => c.trim()));
  }

  const semiCount = nonempty.filter((l) => l.includes(";")).length;
  if (semiCount >= Math.ceil(nonempty.length / 2)) {
    return nonempty.map((l) => l.split(";").map((c) => c.trim()));
  }

  const commaLines = nonempty.filter(
    (l) => l.includes(",") && !/^\s*-?\d+,\d+\s*$/.test(l),
  );
  if (commaLines.length >= Math.ceil(nonempty.length / 2)) {
    return nonempty.map(splitCsvLine);
  }

  return nonempty.map((l) => l.trim().split(/\s+/));
}

function stripHeaders(grid: string[][]): { names: string[] | null; body: string[][] } {
  if (grid.length === 0) return { names: null, body: [] };

  const maxCols = Math.max(...grid.map((r) => r.length));
  const padded = grid.map((r) => {
    const row = r.slice();
    while (row.length < maxCols) row.push("");
    return row;
  });

  const row0 = padded[0];
  const col0 = padded.map((r) => r[0] ?? "");
  const row0Filled = row0.filter((c) => c.trim() !== "");
  const col0Filled = col0.filter((c) => c.trim() !== "");
  const row0Labels =
    row0Filled.length >= 2 && row0Filled.every((c) => parseNumber(c) === null);
  const col0Labels =
    col0Filled.length >= 2 && col0Filled.every((c) => parseNumber(c) === null);

  if (row0Labels && col0Labels) {
    const names = col0.slice(1).map((n, i) => n.trim() || row0[i + 1]?.trim() || `Test ${i + 1}`);
    const body = padded.slice(1).map((r) => r.slice(1));
    return { names, body };
  }
  if (col0Labels && !row0Labels) {
    const names = col0.map((n, i) => n.trim() || `Test ${i + 1}`);
    const body = padded.map((r) => r.slice(1));
    return { names, body };
  }
  if (row0Labels && !col0Labels) {
    const names = row0.map((n, i) => n.trim() || `Test ${i + 1}`);
    const body = padded.slice(1);
    return { names, body };
  }
  return { names: null, body: padded };
}
