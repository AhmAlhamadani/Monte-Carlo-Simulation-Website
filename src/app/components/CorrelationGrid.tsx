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
  type MatrixDirection,
  type MatrixFocus,
} from "../matrix/grid";

const ARROW_DIR: Record<string, MatrixDirection> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

function shouldLeaveOnArrow(el: HTMLInputElement, dir: "left" | "right") {
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  const len = el.value.length;
  if (start !== end) return start === 0 && end === len;
  return dir === "left" ? start === 0 : end === len;
}

export function CorrelationGrid({
  names,
  values,
  inputRefs,
  onNameChange,
  onCellChange,
  onEnter,
}: {
  names: string[];
  values: string[][];
  inputRefs: MutableRefObject<Record<string, HTMLInputElement | null>>;
  onNameChange: (index: number, name: string) => void;
  onCellChange: (r: number, c: number, value: string) => void;
  onEnter: (r: number, c: number) => void;
}) {
  const nameRefs = useRef<(HTMLInputElement | null)[]>([]);

  function focusTarget(target: MatrixFocus) {
    const el =
      target.kind === "name"
        ? nameRefs.current[target.r]
        : inputRefs.current[cellKey(target.r, target.c)];
    if (!el) return;
    el.focus();
    el.select();
  }

  function handleNavKey(
    e: KeyboardEvent<HTMLInputElement>,
    from: MatrixFocus,
  ) {
    const dir = ARROW_DIR[e.key];
    if (!dir || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;

    if (
      (dir === "left" || dir === "right") &&
      !shouldLeaveOnArrow(e.currentTarget, dir)
    ) {
      return;
    }

    const next = neighborFocus(from, dir, names.length);
    if (!next) return;
    e.preventDefault();
    focusTarget(next);
  }

  function handleNameKeyDown(
    e: KeyboardEvent<HTMLInputElement>,
    r: number,
  ) {
    if (e.key === "Enter") {
      const next = neighborFocus({ kind: "name", r }, "down", names.length);
      if (!next) return;
      e.preventDefault();
      focusTarget(next);
      return;
    }
    handleNavKey(e, { kind: "name", r });
  }

  function handleCellKeyDown(
    e: KeyboardEvent<HTMLInputElement>,
    r: number,
    c: number,
  ) {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter(r, c);
      return;
    }
    handleNavKey(e, { kind: "cell", r, c });
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
                    onKeyDown={(e) => handleNameKeyDown(e, r)}
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
                      onKeyDown={(e) => handleCellKeyDown(e, r, c)}
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
