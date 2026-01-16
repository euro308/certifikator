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
import { useSnapToCenter } from '../hooks/use-snap-to-center';
import { useCanvasZoom } from '../hooks/use-canvas-zoom';
import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    type TextElement,
    type ShapeElement,
    type PlaceholderElement,
} from "../types/canvas-types";
import { isShapeCentered } from "@/components/editor/utils/canvas-helpers";

interface EditorCanvasContentProps {
    containerWidth: number;
    containerHeight: number;
}

// SCALE_BY konstanta nyní v use-canvas-zoom.ts

/**
 * Vnitřní obsah plátna s Konva
 */
export function EditorCanvasContent({ containerWidth, containerHeight }: EditorCanvasContentProps) {
    const stageRef = useRef<Konva.Stage>(null);
    // transformerRef přesunut do SelectionTransformer

    // Stav pro editaci textu
    const [editingId, setEditingId] = useState<string | null>(null);
    const editingTextNodeRef = useRef<Konva.Text | null>(null);

    // Stav pro panning
    const [isPanning, setIsPanning] = useState(false);
    const lastPanPosition = useRef<{ x: number; y: number } | null>(null);

    // Reference na vybraný prvek
    useRef<Konva.Node | null>(null);
    // Kontext editoru
    const { elements, selectedId, setSelectedId, updateElement, zoom, setZoom, pan, setPan } = useEditorContext();

    // Hook pro snapping
    const { checkSnap, guides, hideGuides } = useSnapToCenter();

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
    // TRANSFORMER - Logic moved to SelectionTransformer
    // ==========================================================================

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
    // TEXT EDITING - Použití TextEditor komponenty
    // ==========================================================================

    const handleTextDblClick = useCallback((element: TextElement, e: Konva.KonvaEventObject<MouseEvent>) => {
        const textNode = e.target as Konva.Text;

        // Pokud je to placeholder, připravíme ho na editaci (zobrazíme klíč bez {{}})
        if ((element as any).type === 'placeholder') {
            // Zde nic neměníme imperativně - TextEditor dostane initialValue
        }

        // Ulož referenci na textNode a nastav editingId
        editingTextNodeRef.current = textNode;
        setEditingId(element.id);
    }, []);

    const handleTextChange = useCallback((newText: string) => {
        if (editingId) {
            const element = elements.find(el => el.id === editingId);
            if (!element) return;

            if (element.type === 'text') {
                updateElement(editingId, { text: newText });
            } else if (element.type === 'placeholder') {
                // Pro placeholder: odstraníme závorky, pokud je uživatel zadal, a aktualizujeme klíč
                const cleanKey = newText.replace(/^{{|}}$/g, '');
                updateElement(editingId, {
                    placeholderKey: cleanKey,
                    displayText: `{{${cleanKey}}}`
                });
            }
        }
    }, [editingId, elements, updateElement]);

    const handleTextEditorClose = useCallback(() => {
        editingTextNodeRef.current = null;
        setEditingId(null);
    }, []);

    // ==========================================================================
    // TRANSFORM - Změna velikosti a rotace
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

            // Speciální logika pro Line a Arrow - škálování bodů
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
    // EVENT HANDLERS
    // ==========================================================================

    const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background';
        if (clickedOnEmpty) {
            setSelectedId(null);
        }
    };

    const handleDragMove = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target;

        const element = elements.find(el => el.id === id);
        if (!element) return;

        const isCentered = isShapeCentered(element);

        const isLine = element.type === 'shape' &&
            ['line'].includes((element).shapeType);

        const isArrow = element.type === 'shape' &&
            ['arrow'].includes((element).shapeType);

        let width: number;
        let height: number;
        let topLeftX: number;
        let topLeftY: number;

        if (isCentered) {
            // ===== PRO CENTROVANÉ TVARY: Použij clientRect =====
            const clientRect = node.getClientRect({
                skipTransform: true,
                relativeTo: node.getParent() ?? undefined,
            });

            width = clientRect.width;
            height = clientRect.height;

            if (isLine || isArrow) {
                height = height / 2;
            }

            topLeftX = node.x() + clientRect.x;
            topLeftY = node.y() + clientRect.y;
        } else {
            // ===== PRO TOP-LEFT TVARY: Použij node.width/height (BEZ stroke!) =====
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            width = node.width() * scaleX;
            height = node.height() * scaleY;

            if (isLine) {
                // Pro line/arrow použij clientRect výšku
                const clientRect = node.getClientRect({
                    skipTransform: true,
                    relativeTo: node.getParent() ?? undefined,
                });
                height = clientRect.height / 2;
            }

            if (isArrow) {
                const points = (element).points ?? [0, 0, 100, 0];

                // Vypočítej min/max Y z bodů (skutečná výška čáry bez pointeru)
                const yPoints = points.filter((_: number, i: number) => i % 2 === 1); // Jen Y souřadnice
                const minY = Math.min(...yPoints);
                const maxY = Math.max(...yPoints);
                const actualLineHeight = maxY - minY;

                // Pro horizontální čáru je actualLineHeight 0, použij strokeWidth
                const strokeWidth = (element).strokeWidth ?? 2;
                height = actualLineHeight > 0 ? actualLineHeight : strokeWidth;
            }

            topLeftX = node.x();
            topLeftY = node.y();
        }

        const bounds = {
            x: topLeftX,
            y: topLeftY,
            width: width,
            height: height,
            isCentered: false,
        };

        const result = checkSnap(bounds);

        if (isCentered) {
            // Pro centrované tvary
            const clientRect = node.getClientRect({
                skipTransform: true,
                relativeTo: node.getParent() ?? undefined,
            });

            node.position({
                x: result.x - clientRect.x,
                y: result.y - clientRect.y,
            });
        } else {
            // Pro top-left tvary
            node.position({
                x: result.x,
                y: result.y,
            });
        }
    };

    const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
        hideGuides(); // Skrýt vodící čáry
        const node = e.target;
        updateElement(id, {
            x: node.x(),
            y: node.y(),
        });
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
                {/* Pozadí plátna (A4 papír) se stínem */}
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

                {/* Vodící čáry */}
                <CenteringGuides
                    guides={guides}
                    canvasWidth={CANVAS_WIDTH}
                    canvasHeight={CANVAS_HEIGHT}
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

                {/* TextEditor - zobrazí se při editaci textu (uvnitř Stage pomocí Html) */}
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

                {/* Transformer pro rotaci a resize */}
                <SelectionTransformer editingId={editingId} />
            </Layer>
        </Stage>
    );
}
