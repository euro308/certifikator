// =============================================================================
// EDITOR CANVAS - Wrapper s dynamic importem pro SSR kompatibilitu
// =============================================================================
// Konva používá browser APIs (window, document), takže musíme
// importovat Konva komponenty dynamicky s ssr: false

'use client';

import { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useEditorContext } from './editor-context';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './types/canvas-types';

// Dynamický import Konva komponenty BEZ server-side renderování
const EditorCanvasContent = dynamic(
    () => import('./canvas/editor-canvas-content').then(mod => mod.EditorCanvasContent),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-400">Načítám editor...</div>
            </div>
        )
    }
);

/**
 * Wrapper komponenta pro Konva plátno
 * Měří velikost kontejneru a předává ji do EditorCanvasContent
 */
export function EditorCanvas() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const { elements, zoom } = useEditorContext();

    // Měření velikosti kontejneru
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateSize = () => {
            setContainerSize({
                width: container.clientWidth,
                height: container.clientHeight,
            });
        };

        updateSize();
        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, []);

    // Výpočet auto-scale pro debug info
    const padding = 40;
    const availableWidth = containerSize.width - padding * 2;
    const availableHeight = containerSize.height - padding * 2;
    const autoScale = Math.min(
        availableWidth / CANVAS_WIDTH,
        availableHeight / CANVAS_HEIGHT,
        1
    );
    const displayScale = containerSize.width > 0 ? Math.round(autoScale * 100) : 0;

    // Zobrazení zoomu v procentech
    const zoomPercent = Math.round(zoom * 100);

    return (
        <div
            ref={containerRef}
            className="relative flex-1 overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-900"
            style={{ minHeight: '400px' }}
        >
            {/* Debug info */}
            <div className="absolute top-2 right-2 text-xs text-gray-500 dark:text-gray-400 z-10 bg-white/80 dark:bg-black/50 px-2 py-1 rounded">
                Prvků: {elements.length} | Zoom: {zoomPercent}%
            </div>

            {/* Konva Canvas - načteno dynamicky */}
            {containerSize.width > 0 && containerSize.height > 0 && (
                <EditorCanvasContent
                    containerWidth={containerSize.width}
                    containerHeight={containerSize.height}
                />
            )}

            {/* Overlay pro prázdné plátno */}
            {elements.length === 0 && containerSize.width > 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        <p className="text-lg font-medium">Plátno je prázdné</p>
                        <p className="text-sm">Přidejte prvky pomocí panelu vlevo</p>
                    </div>
                </div>
            )}
        </div>
    );
}
