import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";

interface MatrixData {
  testNames: string[];
  correlations: number[][];
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

  const [values, setValues] = useState<string[][]>(() =>
    Array.from({ length: numTests }, (_, r) =>
      Array.from({ length: numTests }, (_, c) =>
        c < r && initialCorrelations[r]?.[c] != null
          ? String(initialCorrelations[r][c])
          : "",
      ),
    ),
  );

  const [error, setError] = useState("");
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const cellOrder = useMemo(() => {
    const list: [number, number][] = [];
    for (let r = 1; r < numTests; r++)
      for (let c = 0; c < r; c++) list.push([r, c]);
    return list;
  }, [numTests]);

  const isValid = (v: string) => {
    if (v.trim() === "") return true;
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

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-4">
        <h1 className="text-[1.9rem] text-foreground">
          Correlation matrix
        </h1>
        <p className="mt-1 text-muted-foreground">
          Name each test and enter the correlation between every pair. Values
          range from −1.0 to +1.0.
        </p>
      </header>

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
                        className="mx-auto flex size-9 items-center justify-center rounded-md bg-secondary text-[0.8rem] font-semibold text-secondary-foreground"
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
                <th className="sticky left-0 z-10 bg-card pr-2 text-left">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-[0.75rem] font-semibold text-secondary-foreground"
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
                    return <td key={c} aria-hidden />;
                  }
                  const k = key(r, c);
                  const v = values[r][c];
                  const invalid = !isValid(v);
                  return (
                    <td key={c}>
                      <input
                        ref={(el) => {
                          inputRefs.current[k] = el;
                        }}
                        type="text"
                        inputMode="decimal"
                        value={v}
                        aria-label={`Correlation between ${names[r]} and ${names[c]}`}
                        aria-invalid={invalid}
                        onChange={(e) => setCell(r, c, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            focusNext(r, c);
                          }
                        }}
                        className={`size-9 rounded-md border text-center text-[0.8rem] outline-none ${
                          invalid
                            ? "border-destructive bg-destructive/10 text-destructive"
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
