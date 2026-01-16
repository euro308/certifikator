// =============================================================================
// CENTERING GUIDES - Vodící čáry pro zarovnání na střed
// =============================================================================

'use client';

import { Line } from 'react-konva';
import type { CenteringGuides as CenteringGuidesType } from '../types/canvas-types';

interface CenteringGuidesProps {
    guides: CenteringGuidesType;
    canvasWidth: number;
    canvasHeight: number;
}

/**
 * Komponenta vykreslující vodící čáry (modré přerušované)
 * Zobrazuje se, když je draggovaný prvek blízko středu plátna
 */
export function CenteringGuides({ guides, canvasWidth, canvasHeight }: CenteringGuidesProps) {
    return (
        <>
            {guides.showVertical && (
                <Line
                    points={[guides.verticalX, 0, guides.verticalX, canvasHeight]}
                    stroke="#3b82f6"
                    strokeWidth={1}
                    dash={[4, 4]}
                    listening={false}
                />
            )}
            {guides.showHorizontal && (
                <Line
                    points={[0, guides.horizontalY, canvasWidth, guides.horizontalY]}
                    stroke="#3b82f6"
                    strokeWidth={1}
                    dash={[4, 4]}
                    listening={false}
                />
            )}
        </>
    );
}
