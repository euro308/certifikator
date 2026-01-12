import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Save, Trash } from "lucide-react";

export type EditorData = {
  canvasData: any | null;
  saveMockCanvas: () => void;
};

export function EditorDialog({ canvasData, saveMockCanvas }: EditorData) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {canvasData === null ? (
          <Button variant="default" className="w-full sm:w-auto">
            <ExternalLink className="size-4"/>
            Otevřít editor
          </Button>
        ) : (
          <Button variant="outline" className="w-full sm:w-auto">
            <ExternalLink className="size-4"/>
            Upravit design
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="h-[95vh] !w-[97vw] max-w-none">
        <DialogHeader>
          <DialogTitle>Editor šablony</DialogTitle>
          <DialogDescription>
            Vytvořte design šablony. Využijte placeholdery, které budou později
            nahrazeny informacemi o držiteli certifikátu.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="flex gap-3">
            <DialogClose asChild>
              <Button
                variant="default"
                onClick={saveMockCanvas}
                className="w-24"
              >
                <Save className="size-4" /> Uložit
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="outline" className="w-24">
                <Trash className="size-4" />
                Zahodit
              </Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
