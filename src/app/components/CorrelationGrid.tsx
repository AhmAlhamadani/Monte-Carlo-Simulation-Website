import type { MutableRefObject } from "react";
import { Input } from "./ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import { cellKey, isValidCorrelation } from "../matrix/grid";

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
                    value={rowName}
                    aria-label={`Name for test ${r + 1}`}
                    onChange={(e) => onNameChange(r, e.target.value)}
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          onEnter(r, c);
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
  );
}
