import React from 'react';
import { Line } from 'react-konva';
import type { SnapLine } from "@/components/editor/hooks/use-snap-to-center";

interface CenteringGuidesProps {
  guides: SnapLine[];
  canvasWidth: number;
  canvasHeight: number;
  lineColor?: string;
}

export function CenteringGuides({
                                  guides,
                                  canvasWidth,
                                  canvasHeight,
                                  lineColor = 'rgb(0, 161, 255)', // Klasická "Konva/Figma" modrá
                                }: CenteringGuidesProps) {
  if (!guides || guides.length === 0) {
    return null;
  }

  return (
    <>
      {guides.map((guide, i) => {
        // Body čáry: [x1, y1, x2, y2]
        // Pro Vertikální: X je fixní (position), Y jde od 0 do výšky plátna
        // Pro Horizontální: Y je fixní (position), X jde od 0 do šířky plátna
        const points =
          guide.orientation === 'V'
            ? [guide.position, 0, guide.position, canvasHeight]
            : [0, guide.position, canvasWidth, guide.position];

        return (
          <Line
            key={`${guide.orientation}-${i}`}
            points={points}
            stroke={lineColor}
            strokeWidth={1}
            dash={[4, 6]} // Přerušovaná čára
            listening={false} // Aby neblokovala myš
            perfectDrawEnabled={false} // Optimalizace výkonu
          />
        );
      })}
    </>
  );
}