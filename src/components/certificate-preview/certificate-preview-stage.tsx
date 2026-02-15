"use client";

import React, { useEffect, useState } from "react";
import { Stage, Layer, Rect } from "react-konva";
import {
  type CanvasElement,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
} from "@/components/editor/types/canvas-types";
import { ReadOnlyCanvasElement } from "./read-only-canvas-element";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CertificatePreviewStageProps {
  elements: CanvasElement[];
  width: number; // Požadovaná šířka kontejneru pro náhled
}

export function CertificatePreviewStage({
  elements,
  width,
}: CertificatePreviewStageProps) {
  // Výpočet měřítka pro malý náhled
  const previewScale = width / CANVAS_WIDTH;
  const previewHeight = CANVAS_HEIGHT * previewScale;
  
  const [certificatePreview, setCertificatePreview] = useState(false);
  
  // State pro rozměry dialogu
  const [dialogDimensions, setDialogDimensions] = useState({
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    scale: 1,
  });

  // Renderujeme pouze na klientovi
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Výpočet rozměrů pro dialog po otevření
  useEffect(() => {
    if (certificatePreview) {
      const calculateDimensions = () => {
        // Maximální rozměry - odečteme padding dialogu a okna
        const maxWidth = Math.min(window.innerWidth - 80, 1200); // Max 1200px nebo okno minus padding
        // Zmenšíme maximální výšku na 85% výšky okna, aby dialog nebyl "přes celou obrazovku" na výšku
        const maxHeight = Math.min(window.innerHeight - 120, window.innerHeight * 0.85);

        // Zkusíme napasovat podle šířky
        let newWidth = maxWidth;
        let newScale = newWidth / CANVAS_WIDTH;
        let newHeight = CANVAS_HEIGHT * newScale;

        // Pokud je výška moc velká (nebo chceme menší), přepočítáme podle výšky
        // Tím se automaticky zmenší i šířka, aby zůstal poměr stran
        if (newHeight > maxHeight) {
          newHeight = maxHeight;
          newScale = newHeight / CANVAS_HEIGHT;
          newWidth = CANVAS_WIDTH * newScale;
        }

        setDialogDimensions({
          width: newWidth,
          height: newHeight,
          scale: newScale,
        });
      };

      calculateDimensions();
      window.addEventListener("resize", calculateDimensions);
      return () => window.removeEventListener("resize", calculateDimensions);
    }
  }, [certificatePreview]);

  if (!isMounted) {
    return (
      <div
        style={{ width, height: previewHeight }}
        className="animate-pulse rounded-md bg-gray-100"
      />
    );
  }

  return (
    <>
      <div
        className="cursor-pointer overflow-hidden rounded-md border bg-white shadow-sm transition-transform hover:scale-[1.02]"
        style={{ width, height: previewHeight }}
        onClick={() => setCertificatePreview(true)}
        title="Klikněte pro zvětšení"
      >
        <Stage
          width={width}
          height={previewHeight}
          scaleX={previewScale}
          scaleY={previewScale}
        >
          <Layer>
            {/* Bílé pozadí */}
            <Rect
              x={0}
              y={0}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              fill="#ffffff"
            />
            {elements.map((element) => (
              <ReadOnlyCanvasElement key={element.id} element={element} />
            ))}
          </Layer>
        </Stage>
      </div>

      <Dialog
        open={certificatePreview}
        onOpenChange={(open) => setCertificatePreview(open)}
      >
        <DialogContent className="max-w-fit w-auto overflow-hidden p-6">
          <DialogHeader className="mb-2">
            <DialogTitle>Detail certifikátu</DialogTitle>
          </DialogHeader>
          
          <div 
            className="overflow-hidden rounded border shadow-sm"
            style={{ width: dialogDimensions.width, height: dialogDimensions.height }}
          >
            <Stage
              width={dialogDimensions.width}
              height={dialogDimensions.height}
              scaleX={dialogDimensions.scale}
              scaleY={dialogDimensions.scale}
            >
              <Layer>
                {/* Bílé pozadí */}
                <Rect
                  x={0}
                  y={0}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  fill="#ffffff"
                />
                {elements.map((element) => (
                  <ReadOnlyCanvasElement key={element.id} element={element} />
                ))}
              </Layer>
            </Stage>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}