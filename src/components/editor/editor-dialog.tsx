// =============================================================================
// EDITOR DIALOG - Modal pro editor šablon
// =============================================================================

"use client";

import { useState, useCallback } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { EditorProvider, useEditorContext } from "./editor-context";
import { EditorSidebar } from "./editor-sidebar";
import { EditorCanvas } from "./editor-canvas";
import {
  DEFAULT_ZOOM_CONFIG,
  type TemplateExportData,
} from "./types/canvas-types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

// =============================================================================
// EDITOR FOOTER - Komponenta uvnitř EditorProvider (má přístup ke contextu)
// =============================================================================

interface EditorFooterProps {
  isSaving: boolean;
  onSaveAndClose: () => void;
}

/**
 * Footer editoru - musí být uvnitř EditorProvider!
 * Obsahuje zoom controls a akční tlačítka
 */
function EditorFooter({ isSaving, onSaveAndClose }: EditorFooterProps) {
  const { zoom, setZoom, resetView, saveTemplate } = useEditorContext();

  const handleZoomIn = () => {
    const newZoom = Math.min(
      zoom + DEFAULT_ZOOM_CONFIG.step,
      DEFAULT_ZOOM_CONFIG.max,
    );
    setZoom(Math.round(newZoom * 100) / 100);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(
      zoom - DEFAULT_ZOOM_CONFIG.step,
      DEFAULT_ZOOM_CONFIG.min,
    );
    setZoom(Math.round(newZoom * 100) / 100);
  };

  const handleResetView = () => {
    if (resetView) {
      resetView();
    } else {
      setZoom(1);
    }
  };

  const handleSave = () => {
    saveTemplate(); // Uloží data přes context
    onSaveAndClose(); // Zavře dialog
  };

  const zoomPercentage = Math.round(zoom * 100);

  return (
    <DialogFooter className="mt-4 flex-shrink-0 select-none">
      <div className="flex w-full items-center justify-between">
        {/* LEVÁ STRANA - Ovládání zoomu */}
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-2">
            <Tooltip>
              {/* tabIndex={-1} zabraňuje automatickému focusu při otevření dialogu */}
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomOut}
                  disabled={zoom <= DEFAULT_ZOOM_CONFIG.min}
                  className="h-8 w-8"
                  tabIndex={-1}
                >
                  <ZoomOut className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Oddálit (min {DEFAULT_ZOOM_CONFIG.min * 100}%)</p>
              </TooltipContent>
            </Tooltip>

            <span className="min-w-[4rem] text-center text-sm font-medium tabular-nums">
              {zoomPercentage}%
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomIn}
                  disabled={zoom >= DEFAULT_ZOOM_CONFIG.max}
                  className="h-8 w-8"
                  tabIndex={-1}
                >
                  <ZoomIn className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Přiblížit (max {DEFAULT_ZOOM_CONFIG.max * 100}%)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResetView}
                  className="ml-1 h-8 w-8"
                  tabIndex={-1}
                >
                  <RotateCcw className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Obnovit výchozí pohled (100%)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* PRAVÁ STRANA - Akční tlačítka */}
        <div className="flex gap-3">
          <DialogClose asChild>
            <Button variant="outline">Zahodit</Button>
          </DialogClose>
          <Button
            onClick={handleSave}
            id={"saveButton"}
            disabled={isSaving}
          >
            {isSaving ? "Ukládám..." : "Uložit šablonu"}
          </Button>
        </div>
      </div>
    </DialogFooter>
  );
}

// =============================================================================
// EDITOR DIALOG - Hlavní komponenta
// =============================================================================

interface EditorDialogProps {
  /** Počáteční data plátna pro editaci existující šablony */
  canvasData?: TemplateExportData | null;
  /** Callback volaný při uložení (po kliknutí na "Uložit šablonu") */
  saveMockCanvas?: (data: TemplateExportData) => void;
}

/**
 * Dialog (modal) pro editor šablon certifikátů
 */
export function EditorDialog({
  canvasData,
  saveMockCanvas,
}: EditorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback((data: TemplateExportData) => {
    console.log("=== ULOŽENÁ DATA ŠABLONY ===");
    console.log(JSON.stringify(data, null, 2));
    console.log("============================");

    if (saveMockCanvas) {
      saveMockCanvas(data);
    }
  }, [saveMockCanvas]);



  /**
   * Handler pro pokus o zavření dialogu (kromě uložení)
   */
  const handleOpenChange = (open: boolean) => {
    if (!open && !isSaving && isOpen) {
      // Pokus o zavření - zobrazit potvrzení
      setShowCloseConfirm(true);
    } else {
      setIsOpen(true);
    }
  };

  /**
   * Potvrzení zavření - zahodit změny
   */
  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    setIsOpen(false);
  };

  /**
   * Zrušení zavření - zůstat v editoru
   */
  const handleCancelClose = () => {
    setShowCloseConfirm(false);
  };

  /**
   * Uložit a zavřít (BEZ potvrzení)
   */
  const handleSaveAndClose = useCallback(() => {
    setIsSaving(true);
    // Krátké zpoždění aby se state stihl uložit
    setTimeout(() => {
      setIsOpen(false);
      setIsSaving(false);
    }, 50);
  }, []);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <div className="flex justify-start items-center gap-4">
          <DialogTrigger asChild>
            {canvasData ? <Button variant="outline" className="cursor-pointer">Upravit design</Button> : <Button variant="default" className="cursor-pointer">Otevřít editor</Button>}
          </DialogTrigger>
          {canvasData ? <div className="flex items-center gap-2">
            <Check color="#00a63e" className="size-4" />
            <span className="text-green-600 text-base">Designový koncept uložen!</span>
          </div> : null}
        </div>

        <DialogContent
          className="flex h-[95vh] w-[97vw] max-w-none flex-col"
          onEscapeKeyDown={(e) => {
            // Zabránit výchozímu chování Escape (zavření dialogu)
            // Keyboard handler v editoru zpracuje Escape pro zrušení selekce
            e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            // Zabránit zavření při kliknutí mimo dialog
            e.preventDefault();
          }}
          onInteractOutside={(e) => {
            // Zabránit zavření při interakci mimo dialog
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle className="select-none">Editor šablony</DialogTitle>
            <DialogDescription className="select-none">
              Vytvořte šablonu certifikátu. Přidejte texty, tvary a
              placeholdery.
            </DialogDescription>
          </DialogHeader>

          <EditorProvider
            onSave={handleSave}
            initialData={canvasData ?? undefined}
          >
            <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
              <EditorSidebar />
              <EditorCanvas />
            </div>

            <EditorFooter
              isSaving={isSaving}
              onSaveAndClose={handleSaveAndClose}
            />
          </EditorProvider>
        </DialogContent>
      </Dialog>

      {/* Potvrzovací dialog pro zavření */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent className={"select-none"}>
          <AlertDialogHeader>
            <AlertDialogTitle>Opravdu chcete odejít?</AlertDialogTitle>
            <AlertDialogDescription>
              Všechny neuložené změny v editoru budou ztraceny. Tuto akci nelze
              vrátit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose}>
              Zůstat v editoru
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>
              Zahodit změny a odejít
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
