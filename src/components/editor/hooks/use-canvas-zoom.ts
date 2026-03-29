import type React from "react";
import { useCallback } from "react";
import type Konva from "konva";
import { DEFAULT_ZOOM_CONFIG } from "../types/canvas-types";

// Hook pro správu přibližování/oddalování plátna
// Implementace podle Konva dokumentace - zoom kolečkem myši se středem pod kurzorem
// Podpora trackpadu (ctrlKey) a scaleBy pattern pro plynulý zoom

// Konstanta pro zoom - čím vyšší, tím jemnější zoom
const SCALE_BY = 1.05;

interface UseCanvasZoomOptions {
  stageRef: React.RefObject<Konva.Stage | null>;
  baseScale: number;
  onZoomChange?: (zoom: number) => void;
  onPanChange?: (pan: { x: number; y: number }) => void;
  containerWidth: number;
  containerHeight: number;
  canvasWidth: number;
  canvasHeight: number;
}

interface UseCanvasZoomReturn {
  handleWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
}

// Hook pro zoom podle Konva dokumentace
export function useCanvasZoom(
  options: UseCanvasZoomOptions,
): UseCanvasZoomReturn {
  const {
    stageRef,
    baseScale,
    onZoomChange,
    onPanChange,
    containerWidth,
    containerHeight,
    canvasWidth,
    canvasHeight,
  } = options;

  // Handler pro kolečko myši - zoom se středem pod kurzorem
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Pozice myši relativně k obsahu stage
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      // Směr zoomu - trackpad má ctrlKey, v tom případě obráceně
      let direction = e.evt.deltaY > 0 ? -1 : 1;
      if (e.evt.ctrlKey) {
        direction = -direction;
      }

      // Nový scale pomocí násobení/dělení
      let newScale = direction > 0 ? oldScale * SCALE_BY : oldScale / SCALE_BY;

      // Omezení na min/max
      const minScale = baseScale * DEFAULT_ZOOM_CONFIG.min;
      const maxScale = baseScale * DEFAULT_ZOOM_CONFIG.max;
      newScale = Math.max(minScale, Math.min(maxScale, newScale));

      // Aplikuj nový scale přímo na stage
      stage.scale({ x: newScale, y: newScale });

      // Nová pozice pro zoom pod kurzorem
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      stage.position(newPos);

      // Volej callbacky pro aktualizaci kontextu
      if (onZoomChange) {
        const newZoom = newScale / baseScale;
        onZoomChange(Math.round(newZoom * 100) / 100);
      }

      if (onPanChange) {
        const newCenterX = (containerWidth - canvasWidth * newScale) / 2;
        const newCenterY = (containerHeight - canvasHeight * newScale) / 2;
        onPanChange({
          x: newPos.x - newCenterX,
          y: newPos.y - newCenterY,
        });
      }
    },
    [
      stageRef,
      baseScale,
      onZoomChange,
      onPanChange,
      containerWidth,
      containerHeight,
      canvasWidth,
      canvasHeight,
    ],
  );

  return {
    handleWheel,
  };
}

// Konstanta SCALE_BY pro použití jinde
export { SCALE_BY };
