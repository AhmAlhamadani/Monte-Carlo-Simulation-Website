import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

export function NewAnalysisFab({
  unsaved,
  onConfirm,
}: {
  unsaved: boolean;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);

  function handleClick() {
    if (unsaved) setOpen(true);
    else onConfirm();
  }

  return (
    <>
      <Button
        type="button"
        size="lg"
        onClick={handleClick}
        aria-label="Start new analysis"
        className="fixed bottom-6 right-8 z-40 shadow-lg lg:right-[19.5rem]"
      >
        <Plus className="size-4" />
        New analysis
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new analysis?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current progress has not been saved and will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
