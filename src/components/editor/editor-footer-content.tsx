import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { DialogClose } from '@/components/ui/dialog';
import { useEditorContext } from './editor-context';
import { DEFAULT_ZOOM_CONFIG } from './types/canvas-types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Obsah patičky editoru
 * 
 * Levá strana: Ovládání zoomu (-, %, +, reset)
 * Pravá strana: Tlačítka Uložit a Zahodit
 */
export function EditorFooterContent() {
  const { zoom, setZoom, resetView, saveTemplate } = useEditorContext();

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + DEFAULT_ZOOM_CONFIG.step, DEFAULT_ZOOM_CONFIG.max);
    setZoom(Math.round(newZoom * 100) / 100);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - DEFAULT_ZOOM_CONFIG.step, DEFAULT_ZOOM_CONFIG.min);
    setZoom(Math.round(newZoom * 100) / 100);
  };

  const handleResetView = () => {
    if (resetView) {
      resetView();
    } else {
      setZoom(1);
    }
  };

  const zoomPercentage = Math.round(zoom * 100);

  return (
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
                <ZoomIn className="h-4 w-4" />
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
                <RotateCcw className="h-4 w-4" />
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
        <DialogClose asChild>
          <Button onClick={saveTemplate}>Uložit šablonu</Button>
        </DialogClose>
      </div>
    </div>
  );
}