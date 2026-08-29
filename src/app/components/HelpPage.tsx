import { ArrowLeft, Info } from "lucide-react";
import { Button } from "./ui/button";

export function HelpPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <Button variant="outline" className="mb-4 gap-2" onClick={onBack}>
          <ArrowLeft className="size-4" /> Back to analysis
        </Button>
        <h1 className="text-[1.9rem] text-foreground">How to use</h1>
        <p className="mt-1 text-muted-foreground">
          PercentAbnormK estimates how often a healthy person would obtain
          abnormally low scores on a battery of correlated tests, by chance
          alone.
        </p>
        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Help sections">
          <a
            href="#simulation"
            className="rounded-md border border-border bg-card px-3 py-1.5 text-[0.85rem] text-foreground hover:bg-accent/60"
          >
            Using the simulation
          </a>
          <a
            href="#features"
            className="rounded-md border border-border bg-card px-3 py-1.5 text-[0.85rem] text-foreground hover:bg-accent/60"
          >
            Application features
          </a>
        </nav>
      </header>

      <section
        id="simulation"
        className="scroll-mt-6 space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <h2 className="text-[1.25rem] font-semibold text-foreground">
          Using the Monte Carlo simulation
        </h2>
        <p className="text-[0.95rem] text-muted-foreground">
          In a long test battery, one or two low scores are often expected even
          in a healthy person. This tool estimates those base rates so you can
          judge whether an observed pattern of low scores is unusual, given the
          tests&apos; correlations.
        </p>

        <ol className="list-decimal space-y-4 pl-5 text-[0.95rem] text-foreground">
          <li>
            <span className="font-semibold">Set the abnormality threshold.</span>
            {" "}
            Choose the percentile that counts as abnormally low (for example
            the 5th percentile). The simulation treats any score at or below
            that cut-off as a low score.
          </li>
          <li>
            <span className="font-semibold">Describe the battery.</span>
            {" "}
            Enter how many tests you are using, name each test, and fill the
            correlation between every pair. Correlations must be between −1.0
            and +1.0. The diagonal is always 1.00 because a test correlates
            perfectly with itself.
          </li>
          <li>
            <span className="font-semibold">Run the simulation.</span>
            {" "}
            The tool draws 100,000 simulated healthy profiles. Each profile is a
            set of correlated scores, generated from your matrix. It then counts
            how many scores in that profile fall below your threshold.
          </li>
          <li>
            <span className="font-semibold">Read the base rates.</span>
            {" "}
            Results show how often a healthy person would have 1 or more, 2 or
            more, and each number of low scores <em>or more</em>. Compare the
            patient&apos;s pattern with these percentages. A common pattern is
            not, by itself, evidence of impairment.
          </li>
        </ol>

        <div className="rounded-md border border-border bg-muted/60 p-4 text-[0.9rem] text-muted-foreground">
          <p>
            Use published correlations from a test manual or normative sample
            where you can. Do not enter patient-identifiable data in the name or
            notes fields. This tool estimates chance-level base rates; it does
            not make a diagnosis.
          </p>
        </div>
      </section>

      <section
        id="features"
        className="mt-6 scroll-mt-6 space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <h2 className="text-[1.25rem] font-semibold text-foreground">
          Application features
        </h2>
        <p className="text-[0.95rem] text-muted-foreground">
          The bar at the top shows Analysis setup, Correlation matrix, and
          Results. You can click a completed step to go back to it.
        </p>

        <div className="space-y-4 text-[0.95rem] text-foreground">
          <div>
            <h3 className="font-semibold">Correlation matrix</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
              <li>
                <span className="text-foreground">Arrow keys</span> move between
                correlation cells and test names. Up and down stay in the same
                column (or between names). Left and right move along the row.
                From a test name, Right jumps into that row&apos;s first
                correlation. From the first correlation, Left returns to the
                name.
              </li>
              <li>
                <span className="text-foreground">Paste from spreadsheet</span>{" "}
                fills the matrix from Excel or Google Sheets (Ctrl+V or Cmd+V,
                or the button). The pasted size must match the number of tests.
                Images, PDFs, or other formats need converting to a spreadsheet
                first.
              </li>
              <li>
                <span className="text-foreground">Clear all</span> empties every
                correlation cell but keeps the test names.
              </li>
              <li>
                <span className="text-foreground">Save</span> stores an
                unfinished matrix in Saved runs as &ldquo;In progress&rdquo;.
                Open it later to continue. Empty cells stay empty.
              </li>
              <li>
                <span className="text-foreground">Run analysis</span> needs a
                complete matrix. Results are then saved automatically in this
                browser.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">New analysis and Saved runs</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
              <li>
                <span className="text-foreground">New analysis</span> (bottom
                right on the matrix and Results pages) starts a blank setup. If
                you have not saved, it asks Yes or No before discarding your
                work.
              </li>
              <li>
                <span className="text-foreground">Export results</span> on the
                Results page downloads a short editable Word document with the
                summary figures and the bar chart.
              </li>
              <li>
                Saved runs appear in the list on the right. Click one to reopen
                it. Drafts open on the matrix; completed runs open on Results.
              </li>
              <li>
                Saving is in this browser only, on this computer. It is not an
                NHS record. Give the analysis a name on setup so you can find it
                later.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

export function HowToUseButton({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      className="shrink-0 gap-2"
      aria-pressed={active}
      onClick={onClick}
    >
      <Info className="size-4" />
      How to use
    </Button>
  );
}
