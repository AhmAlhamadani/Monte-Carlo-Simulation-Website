import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { SetupPage, type SetupValues } from "./components/SetupPage";
import { MatrixPage } from "./components/MatrixPage";
import { ResultsPage } from "./components/ResultsPage";
import { SavedRunsSidebar } from "./components/SavedRunsSidebar";
import { StepIndicator } from "./components/StepIndicator";
import { deleteRun, initDb, listRuns, upsertRun } from "./lib/db";
import { runSimulation, type SimulationResult } from "./lib/monte-carlo";
import type { Analysis, SavedRun } from "./types";

const emptyDraft = (): Analysis => ({
  id: crypto.randomUUID(),
  name: "",
  notes: "",
  percentile: 5,
  numTests: 5,
  testNames: [],
  correlations: [],
  createdAt: Date.now(),
});

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [draft, setDraft] = useState<Analysis>(emptyDraft);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initDb()
      .then(() => {
        setSavedRuns(listRuns());
        setDbReady(true);
      })
      .catch(() => {
        toast.error("Could not load saved runs", {
          description: "Your analyses may not persist until storage is available.",
        });
        setDbReady(true);
      });
  }, []);

  const refreshRuns = useCallback(() => {
    setSavedRuns(listRuns());
  }, []);

  const persistRun = useCallback(
    (analysis: Analysis, simulationResult: SimulationResult, quiet = false) => {
      if (!dbReady) return null;
      try {
        const run = upsertRun({
          ...analysis,
          result: simulationResult,
          createdAt: analysis.createdAt,
        });
        refreshRuns();
        setActiveId(run.id);
        setSaved(true);
        if (!quiet) {
          toast.success("Saved", {
            description: run.name || "Untitled analysis",
          });
        }
        return run;
      } catch {
        toast.error("Could not save run");
        return null;
      }
    },
    [dbReady, refreshRuns],
  );

  const goTo = (s: number) => {
    setStep(s);
    setMaxReached((m) => Math.max(m, s));
  };

  function handleSetupContinue(v: SetupValues) {
    setDraft((prev) => {
      const names =
        prev.testNames.length === v.numTests && prev.numTests === v.numTests
          ? prev.testNames
          : Array.from({ length: v.numTests }, (_, i) => prev.testNames[i] ?? `Test ${i + 1}`);
      const correlations =
        prev.correlations.length === v.numTests ? prev.correlations : [];
      return {
        ...prev,
        name: v.name,
        notes: v.notes,
        percentile: v.percentile,
        numTests: v.numTests,
        testNames: names,
        correlations,
      };
    });
    goTo(1);
  }

  function handleRun(data: { testNames: string[]; correlations: number[][] }) {
    const runId = activeId ?? draft.id;
    const analysis: Analysis = {
      ...draft,
      id: runId,
      testNames: data.testNames,
      correlations: data.correlations,
    };
    setDraft(analysis);
    const res = runSimulation(data.correlations, analysis.percentile);
    setResult(res);
    goTo(2);
    persistRun(analysis, res);
    toast.success("Analysis complete", {
      description: `${analysis.numTests} tests simulated at the ${analysis.percentile}th percentile.`,
    });
  }

  function handleOpenRun(run: SavedRun) {
    setDraft(run);
    setResult(run.result);
    setActiveId(run.id);
    setSaved(true);
    setStep(2);
    setMaxReached(2);
    toast("Opened for editing", {
      description: "Use the steps above to change inputs, then re-run to update results.",
    });
  }

  function handleDeleteRun(id: string) {
    deleteRun(id);
    refreshRuns();
    if (activeId === id) {
      setActiveId(null);
      setSaved(false);
    }
    toast("Run deleted");
  }

  function handleNewAnalysis() {
    setDraft(emptyDraft());
    setResult(null);
    setActiveId(null);
    setSaved(false);
    setStep(0);
    setMaxReached(0);
  }

  // Auto-save metadata and matrix edits for the active run (debounced).
  useEffect(() => {
    if (!dbReady || !result || !activeId || !saved) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      try {
        upsertRun({
          ...draft,
          id: activeId,
          result,
          createdAt: draft.createdAt,
        });
        refreshRuns();
      } catch {
        /* ignore background save failures */
      }
    }, 600);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [draft, result, activeId, saved, dbReady, refreshRuns]);

  const setupInitial = useMemo<SetupValues>(
    () => ({
      name: draft.name,
      notes: draft.notes,
      percentile: draft.percentile,
      numTests: draft.numTests,
    }),
    [draft],
  );

  if (!dbReady) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="size-6 animate-spin" aria-hidden />
        <span className="sr-only">Loading saved runs…</span>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-background text-foreground">
      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="border-b border-border bg-card px-6 py-3">
            <StepIndicator
              current={step}
              maxReached={maxReached}
              onStepClick={(s) => setStep(s)}
            />
          </div>

          <div className="flex-1 px-6 py-8">
            {step === 0 && (
              <SetupPage initial={setupInitial} onContinue={handleSetupContinue} />
            )}
            {step === 1 && (
              <MatrixPage
                numTests={draft.numTests}
                initialNames={draft.testNames}
                initialCorrelations={draft.correlations}
                onBack={(d) => {
                  setDraft((prev) => ({
                    ...prev,
                    testNames: d.testNames,
                    correlations: d.correlations,
                  }));
                  setStep(0);
                }}
                onRun={handleRun}
              />
            )}
            {step === 2 && result && (
              <ResultsPage
                analysis={draft}
                result={result}
                saved={saved}
                onNew={handleNewAnalysis}
                onEdit={() => setStep(1)}
              />
            )}
          </div>
        </main>

        <div className="hidden w-72 shrink-0 lg:block">
          <SavedRunsSidebar
            runs={savedRuns}
            activeId={activeId}
            onOpen={handleOpenRun}
            onDelete={handleDeleteRun}
          />
        </div>
      </div>

      <Toaster position="bottom-right" />
    </div>
  );
}
