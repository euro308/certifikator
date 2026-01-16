import { useCallback, useState, useMemo } from "react";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  type CenteringGuides,
} from "../types/canvas-types";

/**
 * Hook pro zobrazení vodících čar a přichycení k středu plátna
 *
 * Funkce:
 * - Detekce, když je prvek blízko horizontálního/vertikálního středu
 * - Automatické přichycení k středu v rámci tolerance
 * - Poskytnutí dat pro vykreslení vodících čar
 */

interface UseSnapToCenterOptions {
  /** Tolerance přichycení v pixelech (výchozí: 5px) */
  threshold?: number;
  /** Šířka plátna (výchozí: CANVAS_WIDTH) */
  canvasWidth?: number;
  /** Výška plátna (výchozí: CANVAS_HEIGHT) */
  canvasHeight?: number;
  /** Zda je snapping povolen (výchozí: true) */
  enabled?: boolean;
}

interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Zda je origin prvku ve středu (kruh, hvězda) nebo v top-left (obdélník, text) */
  isCentered?: boolean;
  /** Volitelně: Přímo zadaný střed prvku (přebije výpočet) */
  centerX?: number;
  centerY?: number;
}

interface SnapResult {
  /** Nová X pozice (může být upravená při snapu) */
  x: number;
  /** Nová Y pozice (může být upravená při snapu) */
  y: number;
  /** Zda zobrazit vertikální vodící čáru */
  showVerticalGuide: boolean;
  /** Zda zobrazit horizontální vodící čáru */
  showHorizontalGuide: boolean;
}

interface UseSnapToCenterReturn {
  /** Kontroluje pozici a vrací upravené souřadnice + info o vodících čarách */
  checkSnap: (bounds: ElementBounds) => SnapResult;
  /** Aktuální stav vodících čar */
  guides: CenteringGuides;
  /** Skryje všechny vodící čáry */
  hideGuides: () => void;
  /** Střed plátna */
  canvasCenter: { x: number; y: number };
  /** Zapne/vypne snapping */
  setEnabled: (enabled: boolean) => void;
  /** Zda je snapping povolen */
  enabled: boolean;
}

export function useSnapToCenter(
  options: UseSnapToCenterOptions = {},
): UseSnapToCenterReturn {
  const {
    threshold = 5,
    canvasWidth = CANVAS_WIDTH,
    canvasHeight = CANVAS_HEIGHT,
    enabled: initialEnabled = true,
  } = options;

  const [enabled, setEnabled] = useState(initialEnabled);
  const [guides, setGuides] = useState<CenteringGuides>({
    showVertical: false,
    showHorizontal: false,
    verticalX: canvasWidth / 2,
    horizontalY: canvasHeight / 2,
  });

  // Střed plátna
  const canvasCenter = useMemo(
    () => ({
      x: canvasWidth / 2,
      y: canvasHeight / 2,
    }),
    [canvasWidth, canvasHeight],
  );

  /**
   * Kontroluje, zda prvek je blízko středu a vrací upravené souřadnice
   */
  const checkSnap = useCallback(
    (bounds: ElementBounds): SnapResult => {
      if (!enabled) {
        setGuides((prev) => ({
          ...prev,
          showVertical: false,
          showHorizontal: false,
        }));
        return {
          x: bounds.x,
          y: bounds.y,
          showVerticalGuide: false,
          showHorizontalGuide: false,
        };
      }

      // ===== VŽDY pracuj s top-left a šířkou/výškou =====
      const elementCenterX = bounds.x + bounds.width / 2;
      const elementCenterY = bounds.y + bounds.height / 2;

      let resultX = bounds.x;
      let resultY = bounds.y;
      let showVerticalGuide = false;
      let showHorizontalGuide = false;

      // Kontrola vertikálního středu (horizontální čára)
      const diffY = Math.abs(elementCenterY - canvasCenter.y);
      if (diffY <= threshold) {
        resultY = canvasCenter.y - bounds.height / 2;
        showHorizontalGuide = true;
      }

      // Kontrola horizontálního středu (vertikální čára)
      const diffX = Math.abs(elementCenterX - canvasCenter.x);
      if (diffX <= threshold) {
        resultX = canvasCenter.x - bounds.width / 2;
        showVerticalGuide = true;
      }

      setGuides({
        showVertical: showVerticalGuide,
        showHorizontal: showHorizontalGuide,
        verticalX: canvasCenter.x,
        horizontalY: canvasCenter.y,
      });

      return {
        x: resultX,
        y: resultY,
        showVerticalGuide,
        showHorizontalGuide,
      };
    },
    [enabled, canvasCenter, threshold],
  );

  /**
   * Skryje všechny vodící čáry
   */
  const hideGuides = useCallback(() => {
    setGuides((prev) => ({
      ...prev,
      showVertical: false,
      showHorizontal: false,
    }));
  }, []);

  return {
    checkSnap,
    guides,
    hideGuides,
    canvasCenter,
    setEnabled,
    enabled,
  };
}

/**
 * Pomocná funkce pro výpočet pozice prvku vycentrovaného na plátně
 */
export function getCenteredPosition(
  elementWidth: number,
  elementHeight: number,
  canvasWidth: number = CANVAS_WIDTH,
  canvasHeight: number = CANVAS_HEIGHT,
): { x: number; y: number } {
  return {
    x: (canvasWidth - elementWidth) / 2,
    y: (canvasHeight - elementHeight) / 2,
  };
}
