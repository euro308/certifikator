// =============================================================================
// SELECTION TRANSFORMER - Transformace vybraného prvku
// =============================================================================

'use client';

import { useEffect, useRef } from 'react';
import { Transformer } from 'react-konva';
import type Konva from 'konva';
import { useEditorContext } from '../editor-context';

interface SelectionTransformerProps {
    editingId: string | null;
}

/**
 * Komponenta pro zobrazení transformeru kolem vybraného prvku.
 * Zajišťuje automatické připojení k vybranému nodu.
 */
export function SelectionTransformer({ editingId }: SelectionTransformerProps) {
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

    // Omezení anchorů pro text, placeholdery, čáry a šipky (pouze změna šířky)
    const onlyMiddleAnchors = selectedElement?.type === 'text' || selectedElement?.type === 'placeholder' || (selectedElement?.type === 'shape' && selectedElement?.shapeType === 'line') || (selectedElement?.type === 'shape' && selectedElement?.shapeType === 'arrow');

    const allAnchors = (selectedElement?.type === 'shape' && selectedElement?.shapeType === 'rect') || (selectedElement?.type === 'shape' && selectedElement?.shapeType === 'ellipse');

    // Standardně pouze 4 Anchors na krajích (platí pro čtverec, kruh, výseč, oblouk, prstenec, hvězda, pravidelný mnohoúhelník, trojúhelník)
    let enabledAnchors = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

    // Pokud je text/placeholder/šipka/čára, povolíme pouze boční anchory.
    if (onlyMiddleAnchors) {
      enabledAnchors = ['middle-left', 'middle-right'];
    }

    // Pokud je obdélník/elipsa, povolíme všechny anchory.
    if (allAnchors) {
      enabledAnchors = ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'];
    }

    // U RINGU PŘIDAT VELIKOST DÍRY UPROSTŘED!

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
            keepRatio={(!onlyMiddleAnchors && !allAnchors)}
            enabledAnchors={enabledAnchors}
            boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 10 || newBox.height < 10) {
                    return oldBox;
                }
                return newBox;
            }}
        />
    );
}
