// =============================================================================
// KONVA SHAPES - Definice základních tvarů
// =============================================================================
// Zdroj: https://konvajs.org/category/shapes

export type ExtendedShapeType = ShapeType | 'triangle';

import type { ShapeType } from '../types/canvas-types';

export interface ShapeDefinition {
    type: ShapeType;
    label: string;
    description: string;
    icon?: string; // Může být doplněno později
}

export const KONVA_SHAPES: ShapeDefinition[] = [
    {
        type: 'square',
        label: 'Čtverec',
        description: 'Vytvoří čtverec (Konva.Rect se stejnými stranami).',
    },

    {
        type: 'rect',
        label: 'Obdélník',
        description: 'Vytvoří obdélník (Konva.Rect).',
    },

    {
        type: 'circle',
        label: 'Kruh',
        description: 'Vytvoří kruh (Konva.Circle).',
    },
    {
        type: 'ellipse',
        label: 'Elipsa',
        description: 'Vytvoří elipsu (Konva.Ellipse).',
    },
    {
        type: 'line',
        label: 'Čára',
        description: 'Vytvoří čáru (Konva.Line). Může být jednoduchá, lomená, spline nebo blob.',
    },
    {
        type: 'arrow',
        label: 'Šipka',
        description: 'Vytvoří šipku (Konva.Arrow).',
    },
    {
        type: 'wedge',
        label: 'Výseč',
        description: 'Vytvoří kruhovou výseč (Konva.Wedge).',
    },
    {
        type: 'arc',
        label: 'Oblouk',
        description: 'Vytvoří oblouk (Konva.Arc).',
    },
    {
        type: 'ring',
        label: 'Prstenec',
        description: 'Vytvoří prstenec (Konva.Ring).',
    },
    {
        type: 'star',
        label: 'Hvězda',
        description: 'Vytvoří hvězdu (Konva.Star).',
    },
    {
        type: 'regularPolygon',
        label: 'Pravidelný mnohoúhelník',
        description: 'Vytvoří pravidelný mnohoúhelník (Konva.RegularPolygon).',
    },
    {
        type: 'triangle',
        label: 'Trojúhelník',
        description: 'Vytvoří trojúhelník (RegularPolygon se 3 stranami).',
    },
    // Další tvary zmíněné v dokumentaci, které zatím nemají přímou podporu v editoru,
    // ale jsou zde pro referenci:
    // - Group: Pro seskupování tvarů
    // - Image: Pro obrázky
    // - Label: Pro popisky
    // - Sprite: Pro animované sprity
    // - Path: Pro vlastní cesty
];
