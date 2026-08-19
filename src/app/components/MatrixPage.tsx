import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Play, Eraser, CheckSquare, MousePointerSquareDashed, WandSparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";

interface MatrixData {
  testNames: string[];
  correlations: number[][]; // lower-triangular, [row][col] col<row
}

const key = (r: number, c: number) => `${r}-${c}`;

export function MatrixPage({
  numTests,
  initialNames,
  initialCorrelations,
  onBack,
  onRun,
}: {
  numTests: number;
  initialNames: string[];
  initialCorrelations: number[][];
  onBack: (data: MatrixData) => void;
  onRun: (data: MatrixData) => void;
}) {
  const [names, setNames] = useState<string[]>(() =>
    Array.from({ length: numTests }, (_, i) => initialNames[i] ?? `Test ${i + 1}`),
  );

  // Editable cell values as strings for smooth typing.
  const [values, setValues] = useState<string[][]>(() =>
    Array.from({ length: numTests }, (_, r) =>
      Array.from({ length: numTests }, (_, c) =>
        c < r && initialCorrelations[r]?.[c] != null
          ? String(initialCorrelations[r][c])
          : "",
      ),
    ),
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [multiSelect, setMultiSelect] = useState(false);
  const [fillValue, setFillValue] = useState("");
  const [error, setError] = useState("");
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Ordered list of editable (lower-triangular) cell coordinates.
  const cellOrder = useMemo(() => {
    const list: [number, number][] = [];
    for (let r = 1; r < numTests; r++)
      for (let c = 0; c < r; c++) list.push([r, c]);
    return list;
  }, [numTests]);

  const isValid = (v: string) => {
    if (v.trim() === "") return true; // empty handled separately
    const n = Number(v);
    return !isNaN(n) && n >= -1 && n <= 1;
  };

  function setCell(r: number, c: number, v: string) {
    setValues((prev) => {
      const next = prev.map((row) => row.slice());
      next[r][c] = v;
      return next;
    });
  }

  function handleCellClick(r: number, c: number) {
    const k = key(r, c);
    setSelected((prev) => {
      const next = new Set(multiSelect ? prev : []);
      if (multiSelect && next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(cellOrder.map(([r, c]) => key(r, c))));
    setMultiSelect(true);
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function applyFill() {
    if (!isValid(fillValue) || fillValue.trim() === "") {
      setError("Enter a value between −1.0 and 1.0 to fill selected cells.");
      return;
    }
    setError("");
    setValues((prev) => {
      const next = prev.map((row) => row.slice());
      selected.forEach((k) => {
        const [r, c] = k.split("-").map(Number);
        next[r][c] = fillValue;
      });
      return next;
    });
  }

  function clearAllValues() {
    setValues(
      Array.from({ length: numTests }, () =>
        Array.from({ length: numTests }, () => ""),
      ),
    );
    setSelected(new Set());
  }

  function focusNext(r: number, c: number) {
    const idx = cellOrder.findIndex(([rr, cc]) => rr === r && cc === c);
    const nextCell = cellOrder[idx + 1];
    if (nextCell) inputRefs.current[key(nextCell[0], nextCell[1])]?.focus();
  }

  function collect(): MatrixData | null {
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
      if (!isValid(v)) {
        invalid.push(`${names[r]} × ${names[c]}`);
        continue;
      }
      const n = Number(v);
      corr[r][c] = n;
      corr[c][r] = n;
    }

    if (invalid.length) {
      setError(
        `${invalid.length} value(s) are outside the −1.0 to 1.0 range. Please correct them.`,
      );
      return null;
    }
    if (missing.length) {
      setError(
        `${missing.length} correlation(s) still need a value before you can run the analysis.`,
      );
      return null;
    }
    setError("");
    return {
      testNames: names,
      correlations: corr,
    };
  }

  const total = cellOrder.length;
  const filled = cellOrder.filter(([r, c]) => values[r][c].trim() !== "").length;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-4">
        <h1 className="text-foreground" style={{ fontSize: "1.9rem" }}>
          Correlation matrix
        </h1>
        <p className="mt-1 text-muted-foreground">
          Name each test and enter the correlation between every pair. Values
          range from −1.0 to +1.0.
        </p>
      </header>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
        <Button
          type="button"
          variant={multiSelect ? "default" : "outline"}
          size="sm"
          className="gap-2"
          onClick={() => setMultiSelect((m) => !m)}
          aria-pressed={multiSelect}
        >
          {multiSelect ? (
            <CheckSquare className="size-4" />
          ) : (
            <MousePointerSquareDashed className="size-4" />
          )}
          {multiSelect ? "Multi-select on" : "Multi-select"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={selectAll} className="gap-2">
          <CheckSquare className="size-4" /> Select all
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearSelection}
          disabled={selected.size === 0}
        >
          Clear selection
        </Button>

        <div className="mx-1 h-8 w-px bg-border" aria-hidden />

        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="fill" className="text-[0.8rem]">
              Fill selected ({selected.size})
            </Label>
            <Input
              id="fill"
              type="number"
              step="0.05"
              min={-1}
              max={1}
              placeholder="0.30"
              value={fillValue}
              onChange={(e) => setFillValue(e.target.value)}
              className="h-8 w-24"
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="gap-2"
            onClick={applyFill}
            disabled={selected.size === 0}
          >
            <WandSparkles className="size-4" /> Fill
          </Button>
        </div>

        <div className="mx-1 h-8 w-px bg-border" aria-hidden />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearAllValues}
          className="gap-2 text-destructive hover:text-destructive"
        >
          <Eraser className="size-4" /> Clear all
        </Button>

        <div className="ml-auto text-[0.85rem] text-muted-foreground">
          {filled} of {total} pairs entered
        </div>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto rounded-lg border border-border bg-card p-4 shadow-sm">
        <table className="border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card" />
              {names.map((n, c) => (
                <th key={c} className="px-1 pb-1 align-bottom">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="mx-auto flex size-9 items-center justify-center rounded-md bg-secondary text-[0.8rem] text-secondary-foreground"
                        style={{ fontWeight: 600 }}
                      >
                        T{c + 1}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{n}</TooltipContent>
                  </Tooltip>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {names.map((rowName, r) => (
              <tr key={r}>
                {/* Row label / editable test name */}
                <th className="sticky left-0 z-10 bg-card pr-2 text-left">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-[0.75rem] text-secondary-foreground"
                      style={{ fontWeight: 600 }}
                    >
                      T{r + 1}
                    </span>
                    <Input
                      value={rowName}
                      aria-label={`Name for test ${r + 1}`}
                      onChange={(e) =>
                        setNames((prev) => {
                          const next = prev.slice();
                          next[r] = e.target.value;
                          return next;
                        })
                      }
                      className="h-8 w-40"
                    />
                  </div>
                </th>

                {names.map((_, c) => {
                  if (c === r) {
                    return (
                      <td key={c} className="text-center">
                        <div className="mx-auto flex size-9 items-center justify-center rounded-md bg-muted text-[0.8rem] text-muted-foreground">
                          1.00
                        </div>
                      </td>
                    );
                  }
                  if (c > r) {
                    // Upper triangle: mirror, shown faintly, not editable.
                    return <td key={c} aria-hidden />;
                  }
                  const k = key(r, c);
                  const v = values[r][c];
                  const invalid = !isValid(v);
                  const isSel = selected.has(k);
                  return (
                    <td key={c}>
                      <input
                        ref={(el) => {
                          inputRefs.current[k] = el;
                        }}
                        type="number"
                        step="0.05"
                        inputMode="decimal"
                        value={v}
                        aria-label={`Correlation between ${names[r]} and ${names[c]}`}
                        aria-invalid={invalid}
                        onFocus={() => handleCellClick(r, c)}
                        onChange={(e) => setCell(r, c, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            focusNext(r, c);
                          }
                        }}
                        className={`size-9 rounded-md border text-center text-[0.8rem] outline-none transition-colors ${
                          invalid
                            ? "border-destructive bg-destructive/10 text-destructive"
                            : isSel
                              ? "border-primary bg-accent ring-2 ring-primary"
                              : "border-border bg-input-background hover:border-primary/50"
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[0.85rem] text-muted-foreground">
        Tip: press <kbd className="rounded border border-border bg-muted px-1">Enter</kbd> to
        jump to the next cell. Use Multi-select and Fill to set several pairs to
        the same value at once.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-[0.9rem] text-destructive">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          size="lg"
          className="gap-2"
          onClick={() => onBack({ testNames: names, correlations: buildPartial(values, numTests) })}
        >
          <ArrowLeft className="size-4" /> Back
        </Button>
        <Button
          size="lg"
          className="gap-2"
          onClick={() => {
            const data = collect();
            if (data) onRun(data);
          }}
        >
          <Play className="size-4" /> Run analysis
        </Button>
      </div>
    </div>
  );
}

// Preserve whatever has been entered (even if incomplete) when navigating back.
function buildPartial(values: string[][], n: number): number[][] {
  const corr: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
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
