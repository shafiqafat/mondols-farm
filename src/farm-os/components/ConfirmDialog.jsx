import { AlertTriangle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

function ConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  destructive = false,
  loading = false,
}) {
  function handleConfirm() {
    onConfirm?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] overflow-hidden rounded-2xl border-border/70 p-0 shadow-xl">
        <DialogHeader className="px-6 pb-6 pt-6 sm:px-6">
          <div className="flex items-start gap-3.5 pr-7">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                destructive
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <AlertTriangle className="size-5" />
            </div>

            <div className="min-w-0 pt-0.5">
              <DialogTitle className="text-[17px] font-semibold leading-6 tracking-[-0.01em]">
                {title}
              </DialogTitle>

              {description && (
                <DialogDescription className="mt-2 text-sm leading-6 text-muted-foreground">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="m-0 flex-row justify-end gap-2 border-t border-border/60 bg-muted/[0.12] px-8 py-4">
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-[12px] px-4"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            className={`h-9 rounded-[12px] px-4 ${
              destructive
                ? "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                : ""
            }`}
            disabled={loading}
            onClick={handleConfirm}
          >
            {loading ? "Please wait…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDialog;
