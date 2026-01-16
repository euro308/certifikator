import { useCallback, useEffect, useState, useMemo } from 'react';
import type { CanvasElement, ElementUpdate } from '../types/canvas-types';

/**
 * Hook pro správu výběru prvků na plátně a klávesnicové ovládání
 * 
 * Funkce:
 * - Výběr prvku kliknutím
 * - Pohyb vybraného prvku šipkami (1px, Shift+šipka = 10px)
 * - Mazání vybraného prvku (Delete/Backspace)
 * - Zrušení výběru (Escape)
 */

interface UseCanvasSelectionOptions {
    /** Seznam všech prvků na plátně */
    elements: CanvasElement[];
    /** Callback pro aktualizaci seznamu prvků */
    onElementsChange: (elements: CanvasElement[]) => void;
    /** Zda je klávesnicové ovládání povoleno (výchozí: true) */
    keyboardEnabled?: boolean;
}

interface UseCanvasSelectionReturn {
    /** ID aktuálně vybraného prvku */
    selectedId: string | null;
    /** Aktuálně vybraný prvek (nebo null) */
    selectedElement: CanvasElement | null;
    /** Vybere prvek podle ID */
    selectElement: (id: string | null) => void;
    /** Zruší výběr */
    clearSelection: () => void;
    /** Aktualizuje vlastnosti vybraného prvku */
    updateSelectedElement: (updates: ElementUpdate) => void;
    /** Smaže vybraný prvek */
    deleteSelectedElement: () => void;
    /** Handler pro kliknutí na plátno (zruší výběr) */
    handleStageClick: () => void;
    /** Handler pro kliknutí na prvek */
    handleElementClick: (id: string) => void;
}

export function useCanvasSelection(options: UseCanvasSelectionOptions): UseCanvasSelectionReturn {
    const {
        elements,
        onElementsChange,
        keyboardEnabled = true,
    } = options;

    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Najdi vybraný prvek
    const selectedElement = useMemo(() => {
        if (!selectedId) return null;
        return elements.find(el => el.id === selectedId) ?? null;
    }, [selectedId, elements]);

    /**
     * Vybere prvek podle ID
     */
    const selectElement = useCallback((id: string | null) => {
        setSelectedId(id);
    }, []);

    /**
     * Zruší výběr
     */
    const clearSelection = useCallback(() => {
        setSelectedId(null);
    }, []);

    /**
     * Aktualizuje vlastnosti vybraného prvku
     */
    const updateSelectedElement = useCallback((updates: ElementUpdate) => {
        if (!selectedId) return;

        const updatedElements = elements.map(el => {
            if (el.id === selectedId) {
                return { ...el, ...updates } as CanvasElement;
            }
            return el;
        });

        onElementsChange(updatedElements);
    }, [selectedId, elements, onElementsChange]);

    /**
     * Smaže vybraný prvek
     */
    const deleteSelectedElement = useCallback(() => {
        if (!selectedId) return;

        const updatedElements = elements.filter(el => el.id !== selectedId);
        onElementsChange(updatedElements);
        setSelectedId(null);
    }, [selectedId, elements, onElementsChange]);

    /**
     * Handler pro kliknutí na plátno (zruší výběr)
     */
    const handleStageClick = useCallback(() => {
        clearSelection();
    }, [clearSelection]);

    /**
     * Handler pro kliknutí na prvek
     */
    const handleElementClick = useCallback((id: string) => {
        selectElement(id);
    }, [selectElement]);

    /**
     * Klávesnicové ovládání
     */
    useEffect(() => {
        if (!keyboardEnabled || !selectedId) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignoruj, pokud je focus v input/textarea
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }

            const moveAmount = e.shiftKey ? 10 : 1;

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    updateSelectedElement({ y: (selectedElement?.y ?? 0) - moveAmount });
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    updateSelectedElement({ y: (selectedElement?.y ?? 0) + moveAmount });
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    updateSelectedElement({ x: (selectedElement?.x ?? 0) - moveAmount });
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    updateSelectedElement({ x: (selectedElement?.x ?? 0) + moveAmount });
                    break;
                case 'Delete':
                case 'Backspace':
                    // Pouze Delete/Backspace bez kombinace s jinými klávesami
                    if (!e.ctrlKey && !e.altKey && !e.metaKey) {
                        e.preventDefault();
                        deleteSelectedElement();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    clearSelection();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        keyboardEnabled,
        selectedId,
        selectedElement,
        updateSelectedElement,
        deleteSelectedElement,
        clearSelection,
    ]);

    return {
        selectedId,
        selectedElement,
        selectElement,
        clearSelection,
        updateSelectedElement,
        deleteSelectedElement,
        handleStageClick,
        handleElementClick,
    };
}
