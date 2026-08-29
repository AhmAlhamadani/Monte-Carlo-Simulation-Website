import { useRef, type KeyboardEvent, type MutableRefObject } from "react";
import { Input } from "./ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  cellKey,
  isValidCorrelation,
  neighborFocus,
  nextEnterCell,
  type MatrixDirection,
  type MatrixFocus,
} from "../matrix/grid";

function canLeaveHorizontally(el: HTMLInputElement, dir: "left" | "right") {
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  if (start !== end) return start === 0 && end === el.value.length;
  return dir === "left" ? start === 0 : end === el.value.length;
}

export function CorrelationGrid({
  names,
  values,
  inputRefs,
  onNameChange,
  onCellChange,
}: {
  names: string[];
  values: string[][];
  inputRefs: MutableRefObject<Record<string, HTMLInputElement | null>>;
  onNameChange: (index: number, name: string) => void;
  onCellChange: (r: number, c: number, value: string) => void;
}) {
  const nameRefs = useRef<(HTMLInputElement | null)[]>([]);
  const n = names.length;

  function focus(target: MatrixFocus) {
    const el =
      target.kind === "name"
        ? nameRefs.current[target.r]
        : inputRefs.current[cellKey(target.r, target.c)];
    el?.focus();
    el?.select();
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>, from: MatrixFocus) {
    if (e.key === "Enter") {
      const next =
        from.kind === "name"
          ? neighborFocus(from, "down", n)
          : nextEnterCell(from.r, from.c, n);
      if (from.kind === "cell" || next) e.preventDefault();
      if (next) focus(next);
      return;
    }

    if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
    if (!e.key.startsWith("Arrow")) return;
    const dir = e.key.slice(5).toLowerCase() as MatrixDirection;
    if (dir !== "up" && dir !== "down" && dir !== "left" && dir !== "right") return;
    if (
      (dir === "left" || dir === "right") &&
      !canLeaveHorizontally(e.currentTarget, dir)
    ) {
      return;
    }
    const next = neighborFocus(from, dir, n);
    if (!next) return;
    e.preventDefault();
    focus(next);
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card p-4 shadow-sm">
      <table className="border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-card" />
            {names.map((n, c) => (
              <th key={c} className="px-1 pb-1 align-bottom">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="mx-auto flex size-9 items-center justify-center rounded-md bg-secondary text-[0.8rem] font-semibold text-secondary-foreground">
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
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-[0.75rem] font-semibold text-secondary-foreground">
                    T{r + 1}
                  </span>
                  <Input
                    ref={(el) => {
                      nameRefs.current[r] = el;
                    }}
                    value={rowName}
                    aria-label={`Name for test ${r + 1}`}
                    onChange={(e) => onNameChange(r, e.target.value)}
                    onKeyDown={(e) => handleKey(e, { kind: "name", r })}
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
                const k = cellKey(r, c);
                const v = values[r][c];
                const invalid = !isValidCorrelation(v);
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
                      onChange={(e) => onCellChange(r, c, e.target.value)}
                      onKeyDown={(e) => handleKey(e, { kind: "cell", r, c })}
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
  );
}
