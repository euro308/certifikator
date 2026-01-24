// =============================================================================
// CANVAS ELEMENT RENDERER - Vykreslování jednotlivých prvků
// =============================================================================

import React from 'react';
import { Text, Rect, Circle, Ellipse, Wedge, Line, Arrow, Arc, Ring, Star, RegularPolygon, Image } from 'react-konva';
import useImage from 'use-image';
import type Konva from 'konva';
import type {
    CanvasElement,
    TextElement,
    ImageElement,
} from '../types/canvas-types';

interface CanvasElementRendererProps {
    element: CanvasElement;
    isSelected: boolean;
    isEditing: boolean;
    isPanning: boolean;
    onSelect: (id: string | null) => void;
    onClick: (id: string, e: Konva.KonvaEventObject<MouseEvent>) => void;
    onDblClick: (element: TextElement, e: Konva.KonvaEventObject<MouseEvent>) => void;
    onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
    onDragEnd: (id: string, e: Konva.KonvaEventObject<DragEvent>) => void;
    onTransform: (id: string, e: Konva.KonvaEventObject<Event>) => void;
    onTransformEnd: (id: string, e: Konva.KonvaEventObject<Event>) => void;
}

// =============================================================================
// IMAGE ELEMENT COMPONENT - Separátní komponenta pro obrázky (kvůli useImage hook)
// =============================================================================

interface ImageElementRendererProps {
    element: ImageElement;
    commonProps: Record<string, unknown>;
}

/**
 * Vykresluje obrázek na plátno
 * Potřebuje separátní komponentu kvůli použití useImage hooku
 */
function ImageElementRenderer({ element, commonProps }: ImageElementRendererProps) {
    // Rozhodnutí o crossOrigin: pro data URI "undefined" (jinak chyba v Chrome), pro URL "anonymous"
    const crossOrigin = element.src.startsWith('data:') ? undefined : 'anonymous';
    const [image, status] = useImage(element.src, crossOrigin);

    console.log("[ImageElementRenderer] Rendering image:", element.id, "status:", status, "src length:", element.src?.length);

    // Pokud se obrázek načítá, zobrazíme placeholder
    if (status === 'loading') {
        return (
            <Rect
                {...commonProps}
                fill="#f5f5f5"
                stroke="#ccc"
                strokeWidth={1}
                dash={[5, 5]}
            />
        );
    }

    // Pokud selhalo načítání
    if (status === 'failed') {
        console.error("[ImageElementRenderer] Failed to load image", element.id);
        return (
            <Rect
                {...commonProps}
                fill="#ffebeb"
                stroke="#ff4d4d"
                strokeWidth={2}
            />
        );
    }

    // Pokud je obrázek načtený
    return (
        <Image
            {...commonProps}
            image={image}
            // Zajištění překreslení při změně src
            key={`${element.id}-${element.src.slice(0, 20)}`}
        />
    );
}

// =============================================================================
// MAIN CANVAS ELEMENT RENDERER
// =============================================================================

/**
 * Komponenta zodpovědná za vykreslení konkrétního prvku na plátno
 * Rozlišuje typy: text, placeholder, shape, image
 */
export function CanvasElementRenderer({
    element,
    isSelected,
    isEditing,
    isPanning,
    onSelect,
    onClick,
    onDblClick,
    onDragMove,
    onDragEnd,
    onTransform,
    onTransformEnd,
}: CanvasElementRendererProps) {

    // Společné props pro všechny Konva komponenty
    const commonProps = {
        key: element.id,
        id: element.id,
        name: element.name,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        rotation: element.rotation,
        scaleX: 1, // Reset scale, because we apply width/height directly
        scaleY: 1,
        opacity: element.opacity,
        draggable: !element.locked && !isEditing && !isPanning,
        visible: element.visible && !isEditing, // Skrýt při editaci (pro text)

        // Event handlers
        onClick: (e: Konva.KonvaEventObject<MouseEvent>) => onClick(element.id, e),
        onTap: () => onSelect(element.id),
        onDragMove: onDragMove,
        onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => onDragEnd(element.id, e),
        onTransform: (e: Konva.KonvaEventObject<Event>) => onTransform(element.id, e),
        onTransformEnd: (e: Konva.KonvaEventObject<Event>) => onTransformEnd(element.id, e),

        // Cursor handling
        onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => {
            if (!isPanning && !element.locked) {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = 'move';
            }
        },
        onMouseLeave: (e: Konva.KonvaEventObject<MouseEvent>) => {
            if (!isPanning) {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = 'default';
            }
        },
        // Zvětšíme oblast pro kliknutí (hit detection) pro tenké čáry a tvary
        hitStrokeWidth: 20,
    };

    // 1. TEXT ELEMENT
    if (element.type === 'text') {
        const textEl = element;
        return (
            <Text
                {...commonProps}
                text={textEl.text}
                fontSize={textEl.fontSize}
                fontFamily={textEl.fontFamily}
                fontStyle={textEl.fontStyle}
                textDecoration={textEl.textDecoration}
                align={textEl.align}
                fill={textEl.fill}
                wrap="word"
                onDblClick={(e) => onDblClick(textEl, e)}
            />
        );
    }

    // 2. PLACEHOLDER ELEMENT
    if (element.type === 'placeholder') {
        const placeholderEl = element;
        const displayText = placeholderEl.displayText;

        return (
            <Text
                {...commonProps}
                text={displayText}
                fontSize={placeholderEl.fontSize}
                fontFamily={placeholderEl.fontFamily}
                fontStyle={placeholderEl.fontStyle}
                textDecoration={placeholderEl.textDecoration}
                align={placeholderEl.align}
                fill={placeholderEl.fill}
                wrap="word"
                onDblClick={(e) => onDblClick(element as unknown as TextElement, e)}
            />
        );
    }

    // 3. SHAPE ELEMENT
    if (element.type === 'shape') {
        const shapeEl = element;

        // Společné shape props
        const shapeProps = {
            ...commonProps,
            fill: shapeEl.fill,
            stroke: shapeEl.stroke,
            strokeWidth: shapeEl.strokeWidth,
        };

        switch (shapeEl.shapeType) {
            case 'rect':
            case 'square':
                return (
                    <Rect
                        {...shapeProps}
                    />
                );
            case 'circle':
                return (
                    <Circle
                        {...shapeProps}
                        radius={shapeEl.width / 2}
                        x={shapeEl.x}
                        y={shapeEl.y}
                    />
                );
            case 'ellipse':
                return (
                    <Ellipse
                        {...shapeProps}
                        radiusX={shapeEl.width / 2}
                        radiusY={shapeEl.height / 2}
                        x={shapeEl.x}
                        y={shapeEl.y}
                    />
                );
            case 'wedge':
                return (
                    <Wedge
                        {...shapeProps}
                        radius={shapeEl.outerRadius ?? 50}
                        angle={shapeEl.angle ?? 60}
                        x={shapeEl.x}
                        y={shapeEl.y}
                    />
                );
            case 'line':
                return (
                    <Line
                        {...shapeProps}
                        points={shapeEl.points ?? [0, 0, 100, 100]}
                    />
                );
            case 'arrow':
                return (
                    <Arrow
                        {...shapeProps}
                        points={shapeEl.points ?? [0, 0, 100, 100]}
                        pointerLength={shapeEl.pointerLength}
                        pointerWidth={shapeEl.pointerWidth}
                    />
                );
            case 'arc':
                return (
                    <Arc
                        {...shapeProps}
                        angle={shapeEl.angle ?? 180}
                        innerRadius={shapeEl.innerRadius ?? 0}
                        outerRadius={shapeEl.outerRadius ?? 50}
                        x={shapeEl.x}
                        y={shapeEl.y}
                    />
                );
            case 'ring':
                return (
                    <Ring
                        {...shapeProps}
                        innerRadius={shapeEl.innerRadius ?? 20}
                        outerRadius={shapeEl.outerRadius ?? 50}
                        x={shapeEl.x}
                        y={shapeEl.y}
                    />
                );
            case 'star':
                return (
                    <Star
                        {...shapeProps}
                        numPoints={shapeEl.numPoints ?? 5}
                        innerRadius={shapeEl.innerRadius ?? 20}
                        outerRadius={shapeEl.outerRadius ?? 50}
                        x={shapeEl.x}
                        y={shapeEl.y}
                    />
                );
            case 'regularPolygon':
                return (
                    <RegularPolygon
                        {...shapeProps}
                        sides={shapeEl.sides ?? 6}
                        radius={shapeEl.width / 2}
                        x={shapeEl.x}
                        y={shapeEl.y}
                    />
                );
            case 'triangle':
                return (
                    <RegularPolygon
                        {...shapeProps}
                        sides={3}
                        radius={shapeEl.width / 2}
                        x={shapeEl.x}
                        y={shapeEl.y}
                    />
                );
            default:
                // Fallback for unimplemented shapes
                return (
                    <Rect
                        {...shapeProps}
                        fill="#ccc"
                        stroke="#888"
                        dash={[5, 5]}
                    />
                );
        }
    }

    // 4. IMAGE ELEMENT
    if (element.type === 'image') {
        return (
            <ImageElementRenderer
                element={element}
                commonProps={commonProps}
            />
        );
    }

    return null;
}
