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
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "react-konva";

interface DeleteTemplateDialogProps {
  type: "certificate" | "template" | "user" | "take-down-template" | "report";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export function DeleteDialog({
  type,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteTemplateDialogProps) {
  const [reason, setReason] = useState(
    "Porušení pravidel komunity na základě uživatelského nahlášení.",
  );

  if (type === "certificate") {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Opravdu chcete certifikát smazat?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce je nevratná. Smazáním certifikátu jej zneplatníte a
              nebude jej možné nadále verifikovat pomocí tajného klíče.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>Jít zpět</AlertDialogCancel>
            <Button onClick={() => onConfirm()} disabled={isDeleting}>
              {isDeleting ? "Mažu..." : "Smazat certifikát"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (type === "template") {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opravdu chcete šablonu smazat?</AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce je nevratná. Smazání neovlivní certifikáty, které byly
              se šablonou vytvořeny.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>Jít zpět</AlertDialogCancel>
            <Button onClick={() => onConfirm()} disabled={isDeleting}>
              {isDeleting ? "Mažu..." : "Smazat šablonu"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (type === "user") {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Opravdu chcete uživatele vymazat?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce je nevratná. Vymazáním uživatele se také vymažou všechny
              jeho certifikáty a šablony.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>Jít zpět</AlertDialogCancel>
            <Button onClick={() => onConfirm()} disabled={isDeleting}>
              {isDeleting ? "Mažu..." : "Vymazat uživatele"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (type === "take-down-template") {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skrýt šablonu z galerie?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete tuto šablonu stáhnout z veřejné galerie?
              Automaticky se tím zahodí všechny k ní přidružené reporty. Na
              e-mail autora se automaticky odešle upozornění s informací.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-y-1 py-2">
            <div className="ml-0.5 font-medium">
              <Label htmlFor="reason-input">Důvod stažení</Label>
            </div>
            <Input
              id="reason-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Důvod stažení šablony..."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>Zrušit</AlertDialogCancel>
            <Button
              onClick={() => onConfirm(reason)}
              disabled={isDeleting || !reason.trim()}
            >
              {isDeleting ? "Skrývám..." : "Skrýt šablonu"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (type === "report") {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zamítnout nahlášení?</AlertDialogTitle>
            <AlertDialogDescription>
              Tímto zahodíte nahlášení jako neoprávněné. Ostatní nahlášení
              (pokud existují) zůstanou nedotčená.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>Zrušit</AlertDialogCancel>
            <Button onClick={() => onConfirm()} disabled={isDeleting}>
              {isDeleting ? "Mažu..." : "Zamítnout a smazat report"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
}
