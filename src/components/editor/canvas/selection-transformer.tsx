"use client";

import { useEffect, useRef } from "react";
import { Transformer } from "react-konva";
import type Konva from "konva";
import { useEditorContext } from "../editor-context";
import {
  getResizeSnapPositions,
  type SnapLine,
} from "../hooks/use-snap-to-center";

interface SelectionTransformerProps {
  editingId: string | null;
  hideGuides?: () => void;
  showGuides?: (lines: SnapLine[]) => void;
}

/**
 * Komponenta pro zobrazení transformeru kolem vybraných prvků.
 * Zajišťuje automatické připojení k vybraným uzlům.
 */
export function SelectionTransformer({
  editingId,
  hideGuides,
  showGuides,
}: SelectionTransformerProps) {
  const transformerRef = useRef<Konva.Transformer>(null);
  const { selectedIds, elements, selectedElement } = useEditorContext();

  // Automatické připojení k vybraným prvkům
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    // Pokud editujeme text, skryjeme transformer
    // (pouze pokud je vybrán právě jeden prvek a je to ten editovaný)
    if (
      editingId &&
      selectedIds.includes(editingId) &&
      selectedIds.length === 1
    ) {
      transformer.nodes([]);
      return;
    }

    const stage = transformer.getStage();
    if (!stage) return;

    if (selectedIds.length > 0) {
      const nodes: Konva.Node[] = [];
      selectedIds.forEach((id) => {
        const node = stage.findOne(`#${id}`);
        if (node) {
          nodes.push(node);
        }
      });
      transformer.nodes(nodes);
    } else {
      transformer.nodes([]);
    }
  }, [selectedIds, editingId, elements]);

  // Handler pro konec transformace
  const handleTransformEnd = () => {
    if (hideGuides) hideGuides();
  };

  // Logika pro anchory
  // Aplikuje se pouze pokud je vybrán JEDEN prvek.
  // Pokud je vybráno více prvků, použijeme obecné nastavení.

  const isSingleSelection = selectedIds.length === 1;

  const onlyMiddleAnchors =
    isSingleSelection &&
    (selectedElement?.type === "text" ||
      selectedElement?.type === "placeholder" ||
      (selectedElement?.type === "shape" &&
        selectedElement?.shapeType === "line") ||
      (selectedElement?.type === "shape" &&
        selectedElement?.shapeType === "arrow"));

  const allAnchors =
    isSingleSelection &&
    selectedElement?.type === "shape" &&
    (selectedElement?.shapeType === "rect" ||
      selectedElement?.shapeType === "ellipse");

  // Default: pouze rohy (pro většinu tvarů nebo multi-select)
  let enabledAnchors = ["top-left", "top-right", "bottom-left", "bottom-right"];
  let shouldKeepRatio: boolean;

  if (isSingleSelection) {
    if (onlyMiddleAnchors) {
      enabledAnchors = [
        "middle-left",
        "middle-right",
        "top-center",
        "bottom-center",
      ];
      shouldKeepRatio = false; // Text, čáry a šipky – volná deformace
    } else if (allAnchors) {
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
      shouldKeepRatio = false; // Obdélník/elipsa lze deformovat
    } else {
      // Ostatní tvary (kruh, hvězda...) - jen rohy a zachovat poměr
      shouldKeepRatio = true;
    }
  } else {
    // Multi-select: Povolit změnu velikosti všemi směry (rohy) a zachovat poměr?
    // Obvykle u multi-selectu chceme umožnit volné škálování, pokud držíme Shift,
    // ale Konva Transformer má 'keepRatio' natvrdo.
    // Nastavíme false, aby šlo deformovat skupinu, pokud uživatel chce?
    // Většina editorů (Figma) zachovává ratio defaultně, shiftem vypíná.
    // Konva to má naopak (default false, shift true) nebo podle keepRatio.
    // Zde necháme keepRatio = false (respektive default chování), aby šlo skupinu roztahovat.
    shouldKeepRatio = false;

    // Pro multi-select povolíme rohy
    enabledAnchors = ["top-left", "top-right", "bottom-left", "bottom-right"];
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
      // Dynamické props
      keepRatio={shouldKeepRatio}
      enabledAnchors={enabledAnchors}
      onTransformEnd={handleTransformEnd}
      boundBoxFunc={(oldBox, newBox) => {
        if (newBox.width < 10 || newBox.height < 10) {
          return oldBox;
        }
        return newBox;
      }}
      // Snapování povolíme i pro multi select
      anchorDragBoundFunc={(_oldPos, newPos) => {
        const transformer = transformerRef.current;
        if (!transformer) return newPos;

        // Snap pokud máme selectedIds a showGuides/hideGuides
        if (selectedIds.length === 0 || !showGuides || !hideGuides)
          return newPos;

        const layer = transformer.getLayer();
        if (!layer) return newPos;

        const absTransform = layer.getAbsoluteTransform();
        const invTransform = absTransform.copy().invert();
        const localPos = invTransform.point(newPos);

        // Zde předáváme pole ID, které chceme ignorovat (všechny vybrané)
        const stops = getResizeSnapPositions(elements, selectedIds);
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
          activeGuides.push({
            orientation: "V",
            position: bestSnapX,
            type: "center",
          });
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
          activeGuides.push({
            orientation: "H",
            position: bestSnapY,
            type: "center",
          });
        }

        if (activeGuides.length > 0) {
          showGuides(activeGuides);
        } else {
          hideGuides();
        }

        if (bestSnapX !== null || bestSnapY !== null) {
          return absTransform.point({ x: snappedX, y: snappedY });
        }

        return newPos;
      }}
    />
  );
}
