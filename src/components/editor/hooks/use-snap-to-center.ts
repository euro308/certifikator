import { useCallback, useState } from 'react';
import { type CanvasElement, CANVAS_WIDTH, CANVAS_HEIGHT } from '../types/canvas-types';

// --- KONFIGURACE ---
const SNAP_THRESHOLD = 5;

// --- TYPY ---
export type Orientation = 'V' | 'H';

export interface SnapLine {
  orientation: Orientation;
  position: number;
  diff?: number;
  type?: 'start' | 'center' | 'end';
  source?: 'canvas' | 'element';
}

export interface SnapResult {
  x: number;
  y: number;
  guides: SnapLine[];
}

export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  // Přidáváme typ, abychom poznali centered shapes
  type?: string;
  shapeType?: string;
}

// --- LOGIKA NORMALIZACE (TOTO JE KLÍČOVÁ OPRAVA) ---

/**
 * Převede souřadnice prvku na "Box" (x=levý, y=horní),
 * bez ohledu na to, jestli je prvek definovaný středem nebo rohem.
 */
function getNormalizedBox(el: ElementBounds) {
  // Seznam tvarů, které mají anchor ve středu (stejný jako v EditorContext)
  const isCenteredShape =
    el.type === 'shape' &&
    ['circle', 'ellipse', 'wedge', 'arc', 'ring', 'star', 'regularPolygon', 'triangle'].includes(el.shapeType ?? '');

  // Pokud je to centered shape, musíme přepočítat x/y na levý horní roh
  if (isCenteredShape) {
    return {
      x: el.x - (el.width / 2),
      y: el.y - (el.height / 2),
      width: el.width,
      height: el.height,
      centerX: el.x,
      centerY: el.y
    };
  }

  // Pro text, obrázky, rect, square, placeholders je x/y už levý horní roh
  return {
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    centerX: el.x + (el.width / 2),
    centerY: el.y + (el.height / 2)
  };
}

// --- POMOCNÉ FUNKCE ---

function getLineGuideStops(
  elements: CanvasElement[],
  skipId: string | null,
  canvasWidth: number,
  canvasHeight: number
) {
  // 1. Okraje plátna a střed plátna
  const vertical = [0, canvasWidth / 2, canvasWidth];
  const horizontal = [0, canvasHeight / 2, canvasHeight];

  // 2. Ostatní elementy
  elements.forEach((el) => {
    if (el.id === skipId) return;

    // Získáme normalizovaný box (vždy left-top a width-height)
    const box = getNormalizedBox(el);

    // Přidáme Start (levá), Center (střed), End (pravá)
    vertical.push(box.x, box.centerX, box.x + box.width);
    horizontal.push(box.y, box.centerY, box.y + box.height);
  });

  return { vertical, horizontal };
}

function getObjectSnappingEdges(inputBounds: ElementBounds) {
  // I pro právě tažený prvek musíme normalizovat souřadnice
  const box = getNormalizedBox(inputBounds);

  return {
    vertical: [
      { guide: box.x, offset: 0, type: 'start' },        // Levý okraj
      { guide: box.centerX, offset: box.width / 2, type: 'center' }, // Střed
      { guide: box.x + box.width, offset: box.width, type: 'end' },  // Pravý okraj
    ],
    horizontal: [
      { guide: box.y, offset: 0, type: 'start' },        // Horní okraj
      { guide: box.centerY, offset: box.height / 2, type: 'center' }, // Střed
      { guide: box.y + box.height, offset: box.height, type: 'end' }, // Dolní okraj
    ],
  };
}

function getGuides(
  lineGuideStops: { vertical: number[]; horizontal: number[] },
  itemBounds: ReturnType<typeof getObjectSnappingEdges>,
  threshold: number
) {
  const resultV: { lineGuide: number; offset: number; diff: number; type: NonNullable<SnapLine['type']> }[] = [];
  const resultH: { lineGuide: number; offset: number; diff: number; type: NonNullable<SnapLine['type']> }[] = [];

  lineGuideStops.vertical.forEach((lineGuide) => {
    itemBounds.vertical.forEach((itemBound) => {
      const diff = Math.abs(lineGuide - itemBound.guide);
      if (diff < threshold) {
        resultV.push({
          lineGuide,
          offset: itemBound.offset,
          diff,
          type: itemBound.type as NonNullable<SnapLine['type']>
        });
      }
    });
  });

  lineGuideStops.horizontal.forEach((lineGuide) => {
    itemBounds.horizontal.forEach((itemBound) => {
      const diff = Math.abs(lineGuide - itemBound.guide);
      if (diff < threshold) {
        resultH.push({
          lineGuide,
          offset: itemBound.offset,
          diff,
          type: itemBound.type as NonNullable<SnapLine['type']>
        });
      }
    });
  });

  const guides: SnapLine[] = [];

  // Vybereme nejbližší snap
  const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
  const minH = resultH.sort((a, b) => a.diff - b.diff)[0];

  let snapOffsetX = null;
  let snapOffsetY = null;

  if (minV) {
    guides.push({
      orientation: 'V',
      position: minV.lineGuide,
      diff: minV.diff,
      type: minV.type
    });
    snapOffsetX = minV.lineGuide - minV.offset;
  }

  if (minH) {
    guides.push({
      orientation: 'H',
      position: minH.lineGuide,
      diff: minH.diff,
      type: minH.type
    });
    snapOffsetY = minH.lineGuide - minH.offset;
  }

  return { guides, snapOffsetX, snapOffsetY };
}

// --- EXPORTY ---

export function getCenteredPosition(
  elementWidth: number,
  elementHeight: number,
  canvasWidth: number = CANVAS_WIDTH,
  canvasHeight: number = CANVAS_HEIGHT
) {
  return {
    x: (canvasWidth - elementWidth) / 2,
    y: (canvasHeight - elementHeight) / 2,
  };
}

export function getResizeSnapPositions(
  elements: CanvasElement[],
  skipId: string | null,
  canvasWidth: number = CANVAS_WIDTH,
  canvasHeight: number = CANVAS_HEIGHT
) {
  return getLineGuideStops(elements, skipId, canvasWidth, canvasHeight);
}

// --- HLAVNÍ HOOK ---

interface UseSnapToCenterOptions {
  threshold?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  elements: CanvasElement[];
  enabled?: boolean;
}

export function useSnapToCenter({
                                  threshold = SNAP_THRESHOLD,
                                  canvasWidth = CANVAS_WIDTH,
                                  canvasHeight = CANVAS_HEIGHT,
                                  elements,
                                  enabled = true,
                                }: UseSnapToCenterOptions) {

  const [guides, setGuides] = useState<SnapLine[]>([]);

  const checkSnap = useCallback(
    (bounds: ElementBounds, activeId: string): SnapResult => {
      if (!enabled) {
        return { x: bounds.x, y: bounds.y, guides: [] };
      }

      // 1. Zjistit cíle (ostatní prvky + plátno)
      const stops = getLineGuideStops(elements, activeId, canvasWidth, canvasHeight);

      // 2. Zjistit hrany hýbaného objektu (nyní bere v potaz i typ tvaru)
      const edges = getObjectSnappingEdges(bounds);

      // 3. Spočítat snap
      const { guides: detectedGuides, snapOffsetX, snapOffsetY } = getGuides(stops, edges, threshold);

      setGuides(detectedGuides);

      // Pokud nastal snap, musíme vrátit novou pozici.
      // POZOR: snapOffsetX/Y je pozice levého horního rohu (protože jsme tak normalizovali).
      // Pokud je ale hýbaný prvek "centered shape", musíme vrátit střed (x + w/2).

      let finalX = bounds.x;
      let finalY = bounds.y;

      // Zjistíme, jestli hýbeme s centered shape
      const isCenteredDrag = bounds.type === 'shape' &&
        ['circle', 'ellipse', 'wedge', 'arc', 'ring', 'star', 'regularPolygon', 'triangle'].includes(bounds.shapeType ?? '');

      if (snapOffsetX !== null) {
        // snapOffsetX je kde má být levý okraj.
        // Pokud je centered, musíme přičíst poloměr, abychom vrátili střed.
        finalX = isCenteredDrag ? snapOffsetX + (bounds.width / 2) : snapOffsetX;
      }

      if (snapOffsetY !== null) {
        finalY = isCenteredDrag ? snapOffsetY + (bounds.height / 2) : snapOffsetY;
      }

      return {
        x: finalX,
        y: finalY,
        guides: detectedGuides,
      };
    },
    [enabled, elements, canvasWidth, canvasHeight, threshold]
  );

  const clearGuides = useCallback(() => {
    setGuides([]);
  }, []);

  return {
    checkSnap,
    clearGuides,
    hideGuides: clearGuides,
    showGuides: setGuides,
    guides,
  };
}