import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { SetupPage, type SetupValues } from "./components/SetupPage";
import { MatrixPage } from "./components/MatrixPage";
import { ResultsPage } from "./components/ResultsPage";
import { SavedRunsSidebar } from "./components/SavedRunsSidebar";
import { NewAnalysisFab } from "./components/NewAnalysisFab";
import { StepIndicator } from "./components/StepIndicator";
import { HelpPage, HowToUseButton } from "./components/HelpPage";
import { deleteRun, initDb, listRuns, upsertRun } from "./lib/db";
import { runSimulation, type SimulationResult } from "./lib/monte-carlo";
import { isMatrixComplete } from "./matrix/grid";
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
  const [showHelp, setShowHelp] = useState(false);
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
    (
      analysis: Analysis,
      simulationResult: SimulationResult | null,
      message: string | false = "Saved",
    ) => {
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
        if (message !== false) {
          toast.success(message, {
            description:
              simulationResult == null
                ? "This matrix is in Saved runs. You can finish it later."
                : run.name || "Untitled analysis",
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

  const markUnsaved = useCallback(() => setSaved(false), []);

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

  function handleRun(data: { testNames: string[]; correlations: (number | null)[][] }) {
    const runId = activeId ?? draft.id;
    const analysis: Analysis = {
      ...draft,
      id: runId,
      testNames: data.testNames,
      correlations: data.correlations,
    };
    setDraft(analysis);
    const res = runSimulation(data.correlations as number[][], analysis.percentile);
    setResult(res);
    goTo(2);
    persistRun(analysis, res, false);
    toast.success("Analysis complete", {
      duration: 8000,
      description: `${analysis.numTests} tests simulated at the ${analysis.percentile}th percentile.`,
    });
  }

  function handleSaveMatrix(data: { testNames: string[]; correlations: (number | null)[][] }) {
    const runId = activeId ?? draft.id;
    const analysis: Analysis = {
      ...draft,
      id: runId,
      testNames: data.testNames,
      correlations: data.correlations,
    };
    setDraft(analysis);
    const complete = isMatrixComplete(data.correlations, data.testNames.length);
    const nextResult = complete ? result : null;
    if (!complete) setResult(null);
    persistRun(
      analysis,
      nextResult,
      complete ? "Saved" : "Saved for later",
    );
  }

  function handleOpenRun(run: SavedRun) {
    setDraft(run);
    setActiveId(run.id);
    setSaved(true);
    if (run.result && isMatrixComplete(run.correlations, run.numTests)) {
      setResult(run.result);
      setStep(2);
      setMaxReached(2);
      toast("Opened for editing", {
        description: "Use the steps above to change inputs, then re-run to update results.",
      });
      return;
    }
    setResult(null);
    setStep(1);
    setMaxReached(run.result ? 2 : 1);
    toast("Opened saved matrix", {
      description: "You can finish entering correlations, then run the analysis.",
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
        Loading…
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-background text-foreground">
      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-3">
            <div className="min-w-0 flex-1">
              <StepIndicator
                current={step}
                maxReached={maxReached}
                onStepClick={(s) => {
                  setShowHelp(false);
                  setStep(s);
                }}
              />
            </div>
            <HowToUseButton
              active={showHelp}
              onClick={() => setShowHelp((open) => !open)}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            {showHelp && (
              <div className="flex-1 px-6 py-8">
                <HelpPage onBack={() => setShowHelp(false)} />
              </div>
            )}
            <div
              className={
                showHelp
                  ? "hidden"
                  : step === 0
                    ? "flex-1 px-6 py-8"
                    : "flex-1 px-6 pt-8 pb-28"
              }
            >
              {step === 0 && (
                <SetupPage
                  key={draft.id}
                  initial={setupInitial}
                  onContinue={handleSetupContinue}
                />
              )}
              {step === 1 && (
                <MatrixPage
                  key={draft.id}
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
                  onSave={handleSaveMatrix}
                  onRun={handleRun}
                  onDirty={markUnsaved}
                />
              )}
              {step === 2 && result && (
                <ResultsPage
                  analysis={draft}
                  result={result}
                  saved={saved}
                  onEdit={() => setStep(1)}
                />
              )}
            </div>
          </div>
        </main>

        <div className="hidden w-72 shrink-0 lg:block">
          <SavedRunsSidebar
            runs={savedRuns}
            activeId={activeId}
            onOpen={(run) => {
              setShowHelp(false);
              handleOpenRun(run);
            }}
            onDelete={handleDeleteRun}
          />
        </div>
      </div>

      {step > 0 && !showHelp && (
        <NewAnalysisFab unsaved={!saved} onConfirm={handleNewAnalysis} />
      )}
      <Toaster position="top-right" />
    </div>
  );
}
