import { useState } from "react";
import { Clock, Trash2, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import type { SavedRun } from "../types";

export function SavedRunsSidebar({
  runs,
  activeId,
  onOpen,
  onDelete,
}: {
  runs: SavedRun[];
  activeId: string | null;
  onOpen: (run: SavedRun) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <aside className="flex h-full w-full flex-col border-l border-border bg-card">
      <div className="border-b border-border px-4 py-4">
        <h2 className="flex items-center gap-2 text-base text-foreground">
          <Clock className="size-4 text-primary" /> Saved runs
        </h2>
        <p className="mt-0.5 text-[0.8rem] text-muted-foreground">
          {runs.length === 0
            ? "Your saved analyses will appear here."
            : `${runs.length} saved ${runs.length === 1 ? "analysis" : "analyses"}`}
        </p>
      </div>

      <ScrollArea className="flex-1">
        {runs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-muted-foreground">
            <FileText className="size-8 opacity-40" />
            <p className="text-[0.85rem]">
              Save a matrix in progress or run an analysis and it will appear
              here.
            </p>
          </div>
        ) : (
          <ul className="space-y-1 p-2">
            {runs.map((run) => (
              <SavedRunItem
                key={run.id}
                run={run}
                isActive={run.id === activeId}
                onOpen={onOpen}
                onDelete={onDelete}
              />
            ))}
          </ul>
        )}
      </ScrollArea>
    </aside>
  );
}

function SavedRunItem({
  run,
  isActive,
  onOpen,
  onDelete,
}: {
  run: SavedRun;
  isActive: boolean;
  onOpen: (run: SavedRun) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const label = run.name || "Untitled analysis";
  const updatedAt = run.updatedAt ?? run.createdAt;
  const oneOrMore = run.result
    ? ((run.result.atLeast[1] ?? 0) * 100).toFixed(0)
    : null;

  return (
    <li>
      <div
        className={`flex items-start gap-2 rounded-md border p-2.5 ${
          isActive
            ? "border-primary bg-accent"
            : "border-transparent hover:border-border hover:bg-muted/60"
        }`}
      >
        <button
          type="button"
          onClick={() => onOpen(run)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="truncate text-[0.9rem] font-semibold text-foreground">
            {label}
          </div>
          <div className="mt-0.5 text-[0.78rem] text-muted-foreground">
            {run.numTests} tests · {run.percentile}th pct
            {oneOrMore != null ? ` · ${oneOrMore}% ≥1 low` : " · In progress"}
          </div>
          <div className="text-[0.72rem] text-muted-foreground">
            Updated{" "}
            {new Date(updatedAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </div>
        </button>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${label}`}
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this run?</AlertDialogTitle>
              <AlertDialogDescription>
                &ldquo;{label}&rdquo; will be permanently removed from your saved runs.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => onDelete(run.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}
