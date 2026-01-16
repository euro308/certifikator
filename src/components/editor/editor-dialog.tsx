// =============================================================================
// EDITOR DIALOG - Modal pro editor šablon
// =============================================================================

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EditorProvider } from './editor-context';
import { EditorSidebar } from './editor-sidebar';
import { EditorCanvas } from './editor-canvas';
import { EditorFooterContent } from './editor-footer-content';
import type { TemplateExportData } from './types/canvas-types';

interface EditorDialogProps {
  /** Počáteční data plátna pro editaci existující šablony */
  canvasData?: TemplateExportData | null;
  /** Callback volaný při uložení (po kliknutí na "Uložit šablonu") */
  saveMockCanvas?: (data: TemplateExportData) => void;
}

/**
 * Dialog (modal) pro editor šablon certifikátů
 */
export function EditorDialog({ canvasData, saveMockCanvas }: EditorDialogProps) {
  const handleSave = (data: TemplateExportData) => {
    console.log('=== ULOŽENÁ DATA ŠABLONY ===');
    console.log(JSON.stringify(data, null, 2));
    console.log('============================');

    if (saveMockCanvas) {
      saveMockCanvas(data);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Otevřít editor</Button>
      </DialogTrigger>

      <DialogContent className="flex h-[95vh] w-[97vw] max-w-none flex-col">
        <DialogHeader>
          <DialogTitle>Editor šablony</DialogTitle>
          <DialogDescription>
            Vytvořte šablonu certifikátu. Přidejte texty, tvary a placeholdery.
          </DialogDescription>
        </DialogHeader>

        <EditorProvider
          onSave={handleSave}
          initialData={canvasData ?? undefined}
        >
          <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
            <EditorSidebar />
            <EditorCanvas />
          </div>

          <DialogFooter className="mt-4 flex-shrink-0">
            <EditorFooterContent />
          </DialogFooter>
        </EditorProvider>
      </DialogContent>
    </Dialog>
  );
}