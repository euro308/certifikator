// =============================================================================
// SHAPE PROPERTIES SECTION - Vlastnosti vybraného tvaru
// =============================================================================

'use client';

import { useEditorContext } from '../editor-context';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import React from "react";

// Definice kategorií tvarů pro zobrazení vlastností
const REGULAR_SHAPES = ['square', 'circle', 'wedge', 'arc', 'ring', 'star', 'regularPolygon', 'triangle', ]; // Tvary s poměrem stran 1:1 (nebo specifickým ovládáním)
const LINE_SHAPES = ['line', 'arrow']; // Čáry a šipky (definované body, ne šířkou/výškou)

export function ShapePropertiesSection() {
    const { selectedElement, updateElement } = useEditorContext();

    // Zobrazit pouze pokud je vybrán tvar
    if (selectedElement?.type !== 'shape') {
        return null;
    }

    const shape = selectedElement;
    const isRegular = REGULAR_SHAPES.includes(shape.shapeType);
    const isLine = LINE_SHAPES.includes(shape.shapeType);

    // Handlery pro změnu vlastností
    const handleFillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateElement(shape.id, { fill: e.target.value } as any);
    };

    const handleStrokeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateElement(shape.id, { stroke: e.target.value } as any);
    };

    const handleStrokeWidthChange = (value: number[]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateElement(shape.id, { strokeWidth: value[0] } as any);
    };

    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val)) {
            if (isRegular) {
                // Pro pravidelné tvary měníme oba rozměry
                updateElement(shape.id, { width: val, height: val });
            } else {
                updateElement(shape.id, { width: val });
            }
        }
    };

    const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val)) {
            if (isRegular) {
                updateElement(shape.id, { width: val, height: val });
            } else {
                updateElement(shape.id, { height: val });
            }
        }
    };

    return (
        <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-foreground">
                Vlastnosti tvaru
            </h3>

            <div className="space-y-3">
                {/* Rozměry - Skryjeme pro čáry (jsou definované body) */}
                {!isLine && (
                    <div className="grid grid-cols-2 gap-2">
                        {isRegular ? (
                            <div className="space-y-1 col-span-2">
                                <Label htmlFor="shape-size" className="text-xs">Velikost (px)</Label>
                                <Input
                                    id="shape-size"
                                    type="number"
                                    value={Math.round(shape.width)}
                                    onChange={handleWidthChange}
                                    className="h-8"
                                />
                            </div>
                        ) : (
                            <>
                                <div className="space-y-1">
                                    <Label htmlFor="shape-width" className="text-xs">Šířka</Label>
                                    <Input
                                        id="shape-width"
                                        type="number"
                                        value={Math.round(shape.width)}
                                        onChange={handleWidthChange}
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="shape-height" className="text-xs">Výška</Label>
                                    <Input
                                        id="shape-height"
                                        type="number"
                                        value={Math.round(shape.height)}
                                        onChange={handleHeightChange}
                                        className="h-8"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Výplň - Skryjeme pro Line (Arrow může mít výplň šipky) */}
                {shape.shapeType !== 'line' && (
                    <div className="space-y-1">
                        <Label htmlFor="shape-fill" className="text-xs">Výplň</Label>
                        <div className="flex gap-2">
                            <input
                                id="fill-color"
                                type="color"
                                value={shape.fill}
                                onChange={handleFillChange}
                                className="h-8 w-8 cursor-pointer rounded border"
                            />
                            <Input
                                id="shape-fill"
                                type="text"
                                value={shape.fill}
                                onChange={handleFillChange}
                                className="h-8 flex-1"
                                placeholder="#000000 nebo transparent"
                            />
                        </div>
                    </div>
                )}

                {/* Obrys */}
                <div className="space-y-1">
                    <Label htmlFor="shape-stroke" className="text-xs">
                        {isLine ? 'Barva čáry' : 'Obrys'}
                    </Label>
                    <div className="flex gap-2">
                        <input
                            id="stroke-color"
                            type="color"
                            value={shape.stroke}
                            onChange={handleStrokeChange}
                            className="h-8 w-8 cursor-pointer rounded border"
                        />
                        <Input
                            id="shape-stroke"
                            type="text"
                            value={shape.stroke}
                            onChange={handleStrokeChange}
                            className="h-8 flex-1"
                            placeholder="#000000"
                        />
                    </div>
                </div>

                {/* Tloušťka obrysu */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label className="text-xs">
                            {isLine ? 'Tloušťka čáry' : 'Tloušťka obrysu'}
                        </Label>
                        <span className="text-xs text-muted-foreground">{shape.strokeWidth}px</span>
                    </div>
                    <Slider
                        defaultValue={[2]}
                        value={[shape.strokeWidth]}
                        min={0}
                        max={30}
                        step={1}
                        onValueChange={handleStrokeWidthChange}
                    />
                </div>
            </div>
        </div>
    );
}
