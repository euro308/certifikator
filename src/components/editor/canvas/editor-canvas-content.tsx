// =============================================================================
// EDITOR CANVAS CONTENT - Vnitřní implementace Konva plátna
// =============================================================================

'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { useEditorContext } from '../editor-context';
import { TextEditor } from './text-editor';
import { CenteringGuides } from './centering-guides';
import { SelectionTransformer } from './selection-transformer';
import { CanvasElementRenderer } from './canvas-element';
import { useSnapToCenter, type ElementBounds } from '../hooks/use-snap-to-center'; // Přidán import ElementBounds
import { useCanvasZoom } from '../hooks/use-canvas-zoom';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  type TextElement,
  type ShapeElement,
  type PlaceholderElement,
} from "../types/canvas-types";

interface EditorCanvasContentProps {
  containerWidth: number;
  containerHeight: number;
}

/**
 * Vnitřní obsah plátna s Konva
 */
export function EditorCanvasContent({ containerWidth, containerHeight }: EditorCanvasContentProps) {
  const stageRef = useRef<Konva.Stage>(null);

  // Stav pro editaci textu
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingTextNodeRef = useRef<Konva.Text | null>(null);

  // Stav pro panning
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPosition = useRef<{ x: number; y: number } | null>(null);

  // Kontext editoru
  const { elements, selectedId, setSelectedId, updateElement, zoom, setZoom, pan, setPan } = useEditorContext();

  // Hook pro snapping
  const { checkSnap, guides, hideGuides, showGuides } = useSnapToCenter({ elements });

  // ==========================================================================
  // VÝPOČET SCALE A POZICE
  // ==========================================================================

  const padding = 40;
  const availableWidth = containerWidth - padding * 2;
  const availableHeight = containerHeight - padding * 2;
  const baseScale = Math.min(availableWidth / CANVAS_WIDTH, availableHeight / CANVAS_HEIGHT, 1);

  const finalScale = baseScale * zoom;

  const scaledWidth = CANVAS_WIDTH * finalScale;
  const scaledHeight = CANVAS_HEIGHT * finalScale;
  const centerX = (containerWidth - scaledWidth) / 2;
  const centerY = (containerHeight - scaledHeight) / 2;
  const stageX = centerX + pan.x;
  const stageY = centerY + pan.y;

  // ==========================================================================
  // ZOOM - Využívá hook use-canvas-zoom
  // ==========================================================================

  const { handleWheel } = useCanvasZoom({
    stageRef,
    baseScale,
    onZoomChange: setZoom,
    onPanChange: setPan,
    containerWidth,
    containerHeight,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
  });

  // ==========================================================================
  // PANNING
  // ==========================================================================

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Middle mouse button (kolečko)
    if (e.evt.button === 1) {
      e.evt.preventDefault();
      setIsPanning(true);
      lastPanPosition.current = { x: e.evt.clientX, y: e.evt.clientY };

      const stage = stageRef.current;
      if (stage) stage.container().style.cursor = 'grabbing';
    }
  }, []);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isPanning || !lastPanPosition.current) return;

    const dx = e.evt.clientX - lastPanPosition.current.x;
    const dy = e.evt.clientY - lastPanPosition.current.y;

    setPan({
      x: pan.x + dx,
      y: pan.y + dy,
    });

    lastPanPosition.current = { x: e.evt.clientX, y: e.evt.clientY };
  }, [isPanning, pan, setPan]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      lastPanPosition.current = null;

      const stage = stageRef.current;
      if (stage) stage.container().style.cursor = 'default';
    }
  }, [isPanning]);

  // Global mouse up pro případ, že uživatel pustí myš mimo canvas
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isPanning) {
        setIsPanning(false);
        lastPanPosition.current = null;
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isPanning]);

  // Zamezení kontextového menu při panningu
  useEffect(() => {
    const container = stageRef.current?.container();
    if (!container) return;

    const preventContextMenu = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault();
    };
    container.addEventListener('auxclick', preventContextMenu);
    return () => container.removeEventListener('auxclick', preventContextMenu);
  }, []);

  // ==========================================================================
  // TEXT EDITING
  // ==========================================================================

  const handleTextDblClick = useCallback((element: TextElement, e: Konva.KonvaEventObject<MouseEvent>) => {
    const textNode = e.target as Konva.Text;
    editingTextNodeRef.current = textNode;
    setEditingId(element.id);
  }, []);

  const handleTextChange = useCallback((newText: string, newHeight: number) => {
    if (editingId) {
      const element = elements.find(el => el.id === editingId);
      if (!element) return;

      if (element.type === 'text') {
        updateElement(editingId, { 
          text: newText,
          height: newHeight 
        });
      } else if (element.type === 'placeholder') {
        const cleanKey = newText.replace(/^{{|}}$/g, '');
        updateElement(editingId, {
          placeholderKey: cleanKey,
          displayText: `{{${cleanKey}}}`,
          height: newHeight
        });
      }
    }
  }, [editingId, elements, updateElement]);

  const handleTextEditorClose = useCallback(() => {
    editingTextNodeRef.current = null;
    setEditingId(null);
  }, []);

  // ==========================================================================
  // TRANSFORM
  // ==========================================================================

  const handleTransform = useCallback((id: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const element = elements.find(el => el.id === id);

    if (element?.type === 'text') {
      const scaleX = node.scaleX();
      const newWidth = Math.max(20, node.width() * scaleX);

      node.setAttrs({
        width: newWidth,
        scaleX: 1,
        scaleY: 1,
      });
    }
  }, [elements]);

  const handleTransformEnd = useCallback((id: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const element = elements.find(el => el.id === id);

    if (!element) return;

    if (element.type === 'text') {
      const scaleX = node.scaleX();
      const newWidth = Math.max(20, node.width() * scaleX);

      node.scaleX(1);
      node.scaleY(1);
      node.width(newWidth);

      updateElement(id, {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        width: newWidth,
      });
    } else {
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Speciální logika pro Line a Arrow
      const shapeType = (element as ShapeElement).shapeType;
      if (shapeType === 'line' || shapeType === 'arrow') {
        const points = (element as ShapeElement).points ?? [0, 0, 100, 100];
        const newPoints = points.map((p: number, i: number) => {
          return i % 2 === 0 ? p * scaleX : p * scaleY;
        });

        updateElement(id, {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          points: newPoints,
        });
      } else {
        updateElement(id, {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: node.width() * scaleX,
          height: node.height() * scaleY,
        });
      }

      node.scaleX(1);
      node.scaleY(1);
    }
  }, [elements, updateElement]);

  // ==========================================================================
  // DRAG & DROP + SNAPPING
  // ==========================================================================

  const handleDragMove = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;

    // 1. Najdeme originální prvek pro získání metadat (type, shapeType)
    const element = elements.find(el => el.id === id);
    if (!element) return;

    // 2. Sestavíme bounds objekt s metadaty
    // Poznámka: Posíláme raw data z Konva node. Hook se postará o normalizaci (centered vs top-left).
    const bounds: ElementBounds = {
      x: node.x(),
      y: node.y(),
      width: node.width() * node.scaleX(),
      height: node.height() * node.scaleY(),
      rotation: node.rotation(),
      type: element.type,
      shapeType: element.type === 'shape' ? element.shapeType : undefined
    };

    // 3. Zavoláme checkSnap s ID prvku (aby se nelepil sám k sobě)
    const result = checkSnap(bounds, id);

    // 4. Aplikujeme vypočítanou pozici
    // Hook vrací správnou pozici (střed pro centered shapes, top-left pro ostatní)
    node.position({
      x: result.x,
      y: result.y,
    });
  };

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    hideGuides();
    const node = e.target;
    updateElement(id, {
      x: node.x(),
      y: node.y(),
    });
  };

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background';
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  const handleElementClick = (id: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    setSelectedId(id);
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <Stage
      ref={stageRef}
      width={containerWidth}
      height={containerHeight}
      x={stageX}
      y={stageY}
      scaleX={finalScale}
      scaleY={finalScale}
      onClick={handleStageClick}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Layer>
        {/* Pozadí plátna (A4 papír) */}
        <Rect
          name="background"
          x={0}
          y={0}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          fill="#ffffff"
          shadowColor="rgba(0, 0, 0, 0.25)"
          shadowBlur={25}
          shadowOffsetX={0}
          shadowOffsetY={4}
          stroke="#e5e7eb"
          strokeWidth={1}
        />

        {/* Vykreslení prvků */}
        {elements.map((element) => (
          <CanvasElementRenderer
            key={element.id}
            element={element}
            isSelected={selectedId === element.id}
            isEditing={editingId === element.id}
            isPanning={isPanning}
            onSelect={setSelectedId}
            onClick={handleElementClick}
            onDblClick={handleTextDblClick}
            onDragMove={(e) => handleDragMove(element.id, e)}
            onDragEnd={handleDragEnd}
            onTransform={handleTransform}
            onTransformEnd={handleTransformEnd}
          />
        ))}

        {/* Vodící čáry (vždy nad prvky) */}
        <CenteringGuides
          guides={guides}
          canvasWidth={CANVAS_WIDTH}
          canvasHeight={CANVAS_HEIGHT}
        />

        {/* TextEditor Overlay */}
        {editingId && editingTextNodeRef.current && (
          <TextEditor
            textNode={editingTextNodeRef.current}
            onChange={handleTextChange}
            onClose={handleTextEditorClose}
            initialValue={
              elements.find(el => el.id === editingId)?.type === 'placeholder'
                ? (elements.find(el => el.id === editingId) as PlaceholderElement).placeholderKey
                : undefined
            }
          />
        )}

        {/* Transformer */}
        <SelectionTransformer
          editingId={editingId}
          showGuides={showGuides}
          hideGuides={hideGuides}
        />
      </Layer>
    </Stage>
  );
}