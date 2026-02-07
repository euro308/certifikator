import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteTemplateDialogProps {
  type: "certificate" | "template";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export function DeleteDialog({type, open, onOpenChange, onConfirm, onCancel, isDeleting} : DeleteTemplateDialogProps) {
  if(type === 'certificate') {
    return (
      <AlertDialog
        open={open}
        onOpenChange={onOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opravdu chcete certifikát smazat?</AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce je nevratná. Smazáním certifikátu jej zneplatníte a nebude jej možné nadále verifikovat pomocí tajného klíče.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>
              Jít zpět
            </AlertDialogCancel>
            <Button
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Mažu..." : "Smazat certifikát"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  if(type === 'template') {
    return (
      <AlertDialog
        open={open}
        onOpenChange={onOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opravdu chcete šablonu smazat?</AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce je nevratná. Smazání neovlivní certifikáty, které byly
              se šablonou vytvořeny.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>
              Jít zpět
            </AlertDialogCancel>
            <Button
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Mažu..." : "Smazat šablonu"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
}