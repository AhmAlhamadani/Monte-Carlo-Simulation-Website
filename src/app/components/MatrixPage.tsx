import { ArrowLeft, ClipboardPaste, Eraser, Play, Save } from "lucide-react";
import { Button } from "./ui/button";
import { CorrelationGrid } from "./CorrelationGrid";
import { useCorrelationMatrix } from "../hooks/useCorrelationMatrix";
import { cellKey, type MatrixData } from "../matrix/grid";

export function MatrixPage({
  numTests,
  initialNames,
  initialCorrelations,
  onBack,
  onSave,
  onRun,
  onDirty,
}: {
  numTests: number;
  initialNames: string[];
  initialCorrelations: (number | null)[][];
  onBack: (data: MatrixData) => void;
  onSave: (data: MatrixData) => void;
  onRun: (data: MatrixData) => void;
  onDirty?: () => void;
}) {
  const matrix = useCorrelationMatrix(
    numTests,
    initialNames,
    initialCorrelations,
    onDirty,
  );

  function focusNext(r: number, c: number) {
    const idx = matrix.cellOrder.findIndex(([rr, cc]) => rr === r && cc === c);
    const nextCell = matrix.cellOrder[idx + 1];
    if (!nextCell) return;
    const el = matrix.inputRefs.current[cellKey(nextCell[0], nextCell[1])];
    el?.focus();
    el?.select();
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
        <p className="mt-3 rounded-md border border-border bg-muted/60 p-3 text-[0.85rem] text-muted-foreground">
          You can paste a correlation matrix copied from a tabular format such as Excel or
          Google Sheets. Use <span className="text-foreground">Ctrl+V</span>{" "}
          (Cmd+V on Mac) or the button below. This only accepts spreadsheet copy
          and paste. If your table is in a different format (image, PDF, or a
          designed document), ask an AI tool to convert it into a spreadsheet
          matrix first, then paste it here.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => void matrix.pasteFromClipboard()}
        >
          <ClipboardPaste className="size-4" /> Paste from spreadsheet
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-2 text-destructive hover:text-destructive"
          onClick={matrix.clearAll}
        >
          <Eraser className="size-4" /> Clear all
        </Button>
      </div>

      <CorrelationGrid
        names={matrix.names}
        values={matrix.values}
        inputRefs={matrix.inputRefs}
        onNameChange={matrix.setName}
        onCellChange={matrix.setCell}
        onEnter={focusNext}
      />

      {matrix.info && (
        <p className="mt-3 text-[0.9rem] text-muted-foreground">{matrix.info}</p>
      )}

      {matrix.error && (
        <p role="alert" className="mt-3 text-[0.9rem] text-destructive">
          {matrix.error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          size="lg"
          className="gap-2"
          onClick={() => onBack(matrix.snapshot())}
        >
          <ArrowLeft className="size-4" /> Back
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={() => onSave(matrix.snapshot())}
          >
            <Save className="size-4" /> Save
          </Button>
          <Button
            size="lg"
            className="gap-2"
            onClick={() => {
              const data = matrix.collect();
              if (data) onRun(data);
            }}
          >
            <Play className="size-4" /> Run analysis
          </Button>
        </div>
      </div>
    </div>
  );
}
