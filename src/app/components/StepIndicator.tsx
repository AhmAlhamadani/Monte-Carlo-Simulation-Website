import { Check } from "lucide-react";

const STEPS = ["Analysis setup", "Correlation matrix", "Results"];

export function StepIndicator({
  current,
  onStepClick,
  maxReached,
}: {
  current: number; // 0-based
  onStepClick?: (step: number) => void;
  maxReached: number;
}) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center gap-2 sm:gap-4">
        {STEPS.map((label, i) => {
          const isDone = i < current;
          const isActive = i === current;
          const clickable = onStepClick && i <= maxReached;
          return (
            <li key={label} className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(i)}
                aria-current={isActive ? "step" : undefined}
                className={`flex items-center gap-2.5 rounded-md px-2 py-1 text-left ${
                  clickable ? "cursor-pointer hover:bg-accent/60" : "cursor-default"
                }`}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-[0.8rem] ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : isDone
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                <span
                  className={`hidden text-[0.9rem] sm:inline ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                  style={{ fontWeight: isActive ? 600 : 400 }}
                >
                  {label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={`h-0.5 w-4 sm:w-8 ${
                    i < current ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
