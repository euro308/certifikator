"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Flag, Loader2 } from "lucide-react";

interface ReportTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  isPending: boolean;
  onSubmit: (reason: string) => void;
}

export function ReportTemplateDialog({
  open,
  onOpenChange,
  templateName,
  isPending,
  onSubmit,
}: ReportTemplateDialogProps) {
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (!reason.trim()) return;
    onSubmit(reason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="size-5" />
            Nahlásit šablonu
          </DialogTitle>
          <DialogDescription>
            Chystáte se nahlásit šablonu <strong>{templateName}</strong>.
            Vysvětlete administrátorům, proč tuto šablonu nahlašujete (nevhodný
            obsah, chráněné logo, spam atd.).
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            placeholder="Důvod nahlášení..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px] resize-y"
            disabled={isPending}
          />
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Zrušit
          </Button>
          <Button onClick={handleSubmit} disabled={!reason.trim() || isPending}>
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            Odeslat nahlášení
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
