import { useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { PERCENTILE_OPTIONS } from "../types";

export interface SetupValues {
  name: string;
  notes: string;
  percentile: number;
  numTests: number;
}

export function SetupPage({
  initial,
  onContinue,
}: {
  initial: SetupValues;
  onContinue: (values: SetupValues) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [notes, setNotes] = useState(initial.notes);
  const [percentile, setPercentile] = useState(initial.percentile);
  const [numTests, setNumTests] = useState(String(initial.numTests));
  const [error, setError] = useState("");

  function handleContinue() {
    const n = parseInt(numTests, 10);
    if (!numTests || isNaN(n)) {
      setError("Please enter the number of tests in the battery.");
      return;
    }
    if (n < 2) {
      setError("A battery needs at least 2 tests to analyse.");
      return;
    }
    if (n > 25) {
      setError("This tool supports a maximum of 25 tests.");
      return;
    }
    setError("");
    onContinue({ name: name.trim(), notes: notes.trim(), percentile, numTests: n });
  }

  const selected = PERCENTILE_OPTIONS.find((o) => o.value === percentile);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-foreground" style={{ fontSize: "1.9rem" }}>
          Analysis setup
        </h1>
        <p className="mt-1 text-muted-foreground">
          Define what counts as an abnormally low score and how many tests are in
          the battery. You can name the analysis so it is easy to find later.
        </p>
      </header>

      <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        {/* Analysis name */}
        <div className="space-y-1.5">
          <Label htmlFor="analysis-name">Analysis name (optional)</Label>
          <Input
            id="analysis-name"
            value={name}
            placeholder="e.g. Patient A – Memory Battery"
            onChange={(e) => setName(e.target.value)}
          />
          <p className="text-[0.85rem] text-muted-foreground">
            A recognisable label. No patient-identifiable data should be entered.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Percentile threshold */}
          <div className="space-y-1.5">
            <Label htmlFor="percentile">Abnormality threshold</Label>
            <Select
              value={String(percentile)}
              onValueChange={(v) => setPercentile(Number(v))}
            >
              <SelectTrigger id="percentile" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERCENTILE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[0.85rem] text-muted-foreground">
              A score at or below this percentile is treated as abnormally low.
              {selected ? ` ${selected.desc}.` : ""}
            </p>
          </div>

          {/* Number of tests */}
          <div className="space-y-1.5">
            <Label htmlFor="num-tests">Number of tests in the battery</Label>
            <Input
              id="num-tests"
              type="number"
              min={2}
              max={25}
              inputMode="numeric"
              value={numTests}
              onChange={(e) => setNumTests(e.target.value)}
              aria-invalid={!!error}
            />
            <p className="text-[0.85rem] text-muted-foreground">
              Between 2 and 25 tests. You will name each test on the next step.
            </p>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            placeholder="e.g. Correlations sourced from test manual normative sample."
            rows={3}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-start gap-2 rounded-md bg-accent/60 p-3 text-[0.85rem] text-accent-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            This tool estimates how many low scores would be expected{" "}
            <em>by chance</em> in a healthy person, given the correlations between
            your tests. It supports interpretation — it is not a diagnosis.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-[0.9rem] text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end border-t border-border pt-4">
          <Button size="lg" onClick={handleContinue} className="gap-2">
            Continue to correlation matrix
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
