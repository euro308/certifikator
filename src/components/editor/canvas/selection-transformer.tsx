// =============================================================================
// SELECTION TRANSFORMER - Transformace vybraného prvku
// =============================================================================

"use client";

import { useEffect, useRef } from "react";
import { Transformer } from "react-konva";
import type Konva from "konva";
import { useEditorContext } from "../editor-context";
import { getResizeSnapPositions, type SnapLine } from "../hooks/use-snap-to-center";

interface SelectionTransformerProps {
  editingId: string | null;
  hideGuides?: () => void;
  showGuides?: (lines: SnapLine[]) => void;
}

/**
 * Komponenta pro zobrazení transformeru kolem vybraného prvku.
 * Zajišťuje automatické připojení k vybranému nodu.
 */
export function SelectionTransformer({ editingId, hideGuides, showGuides }: SelectionTransformerProps) {
  const transformerRef = useRef<Konva.Transformer>(null);
  const { selectedId, elements, selectedElement } = useEditorContext();

  // Automatické připojení k vybranému prvku
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    // Pokud editujeme text, skryjeme transformer (používá se text editor)
    if (editingId === selectedId) {
      transformer.nodes([]);
      return;
    }

    const stage = transformer.getStage();
    if (!stage) return;

    if (selectedId) {
      const selectedNode = stage.findOne(`#${selectedId}`);
      if (selectedNode) {
        transformer.nodes([selectedNode]);
      } else {
        transformer.nodes([]);
      }
    } else {
      transformer.nodes([]);
    }
  }, [selectedId, editingId, elements]);

  // Handler pro konec transformace (skrytí vodítek)
  const handleTransformEnd = () => {
    if (hideGuides) hideGuides();
  };

  // Omezení anchorů pro text, placeholdery, čáry a šipky (pouze změna šířky)
  const onlyMiddleAnchors =
    selectedElement?.type === "text" ||
    selectedElement?.type === "placeholder" ||
    (selectedElement?.type === "shape" &&
      selectedElement?.shapeType === "line") ||
    (selectedElement?.type === "shape" &&
      selectedElement?.shapeType === "arrow");

  const allAnchors =
    (selectedElement?.type === "shape" &&
      selectedElement?.shapeType === "rect") ||
    (selectedElement?.type === "shape" &&
      selectedElement?.shapeType === "ellipse");

  // Standardně pouze 4 Anchors na krajích (platí pro čtverec, kruh, výseč, oblouk, prstenec, hvězda, pravidelný mnohoúhelník, trojúhelník)
  let enabledAnchors = ["top-left", "top-right", "bottom-left", "bottom-right"];

  // Pokud je text/placeholder/šipka/čára, povolíme pouze boční anchory.
  if (onlyMiddleAnchors) {
    enabledAnchors = ["middle-left", "middle-right"];
  }

  // Pokud je obdélník/elipsa, povolíme všechny anchory.
  if (allAnchors) {
    enabledAnchors = [
      "top-left",
      "top-center",
      "top-right",
      "middle-left",
      "middle-right",
      "bottom-left",
      "bottom-center",
      "bottom-right",
    ];
  }

  return (
    <Transformer
      ref={transformerRef}
      rotationSnaps={[0, 90, 180, 270]}
      rotationSnapTolerance={5}
      borderStroke="#3b82f6"
      borderStrokeWidth={2}
      borderDash={[4, 4]}
      anchorFill="#ffffff"
      anchorStroke="#3b82f6"
      anchorStrokeWidth={2}
      anchorSize={10}
      rRadius={5}
      rotateAnchorOffset={25}
      rotateEnabled={true}
      ignoreStroke={true}
      keepRatio={!onlyMiddleAnchors && !allAnchors}
      enabledAnchors={enabledAnchors}
      onTransformEnd={handleTransformEnd}
      boundBoxFunc={(oldBox, newBox) => {
        // Limit minimální velikosti
        if (newBox.width < 10 || newBox.height < 10) {
          return oldBox;
        }
        return newBox;
      }}
      anchorDragBoundFunc={(oldPos, newPos) => {
        const transformer = transformerRef.current;
        if (!transformer) return newPos;

        // Pokud nemáme funkce pro guides, neřešíme
        if (!showGuides || !hideGuides || !selectedId) return newPos;

        // Transformace do lokálních souřadnic (protože guides jsou lokální)
        const layer = transformer.getLayer();
        if (!layer) return newPos;

        const absTransform = layer.getAbsoluteTransform();
        const invTransform = absTransform.copy().invert();
        const localPos = invTransform.point(newPos);

        // Získat snap linky
        const stops = getResizeSnapPositions(elements, selectedId);
        const SNAP_THRESHOLD = 5;
        const activeGuides: SnapLine[] = [];

        let snappedX = localPos.x;
        let snappedY = localPos.y;

        // Snap X
        let bestDiffX = SNAP_THRESHOLD;
        let bestSnapX = null;
        for (const guide of stops.vertical) {
          const diff = Math.abs(guide - localPos.x);
          if (diff < bestDiffX) {
            bestDiffX = diff;
            bestSnapX = guide;
          }
        }
        if (bestSnapX !== null) {
          snappedX = bestSnapX;
          activeGuides.push({ orientation: 'V', position: bestSnapX, type: 'center' });
        }

        // Snap Y
        let bestDiffY = SNAP_THRESHOLD;
        let bestSnapY = null;
        for (const guide of stops.horizontal) {
          const diff = Math.abs(guide - localPos.y);
          if (diff < bestDiffY) {
            bestDiffY = diff;
            bestSnapY = guide;
          }
        }
        if (bestSnapY !== null) {
          snappedY = bestSnapY;
          activeGuides.push({ orientation: 'H', position: bestSnapY, type: 'center' });
        }

        // Zobrazení/skrytí vodítek
        if (activeGuides.length > 0) {
          showGuides(activeGuides);
        } else {
          hideGuides();
        }

        // Návrat do absolutních souřadnic
        if (bestSnapX !== null || bestSnapY !== null) {
          return absTransform.point({ x: snappedX, y: snappedY });
        }

        return newPos;
      }}
    />
  );
}
