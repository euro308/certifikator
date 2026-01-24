// editor/editor-context.tsx - Globální stav editoru šablon
'use client';

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type {
  CanvasElement,
  TextElement,
  PlaceholderElement,
  ShapeElement,
  ImageElement,
  ShapeType,
  AnyElementUpdate,
  PanState,
  TemplateExportData,
} from './types/canvas-types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DEFAULT_TEXT_ELEMENT,
  DEFAULT_PLACEHOLDER_ELEMENT,
  DEFAULT_SHAPE_ELEMENT,
  DEFAULT_IMAGE_ELEMENT,
} from './types/canvas-types';
import { getCenteredPosition } from './hooks/use-snap-to-center';
import { useUndoRedo } from "./hooks/use-undo-redo";

// =============================================================================
// TYPY KONTEXTU
// =============================================================================

interface EditorContextType {
  // Prvky na plátně
  elements: CanvasElement[];
  setElements: (elements: CanvasElement[]) => void;
  addElement: (element: CanvasElement, shouldSelect?: boolean) => void;
  updateElement: (id: string, updates: AnyElementUpdate, saveHistory?: boolean) => void;
  deleteElement: (id: string) => void;
  deleteSelectedElements: () => void; // New method for multi-delete
  reorderElements: (fromIndex: number, toIndex: number) => void;

  // Výběr (Multi-select)
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;

  // Zpětná kompatibilita pro UI (vrací hodnotu jen pokud je vybrán přesně 1 prvek)
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selectedElement: CanvasElement | null;

  // Zoom a pan
  zoom: number;
  setZoom: (zoom: number) => void;
  pan: PanState;
  setPan: (pan: PanState) => void;
  resetView: () => void;

  // Tovární metody pro vytváření prvků
  createTextElement: () => void;
  createPlaceholderElement: (placeholderKey: string) => void;
  createShapeElement: (shapeType: ShapeType) => void;
  createImageElement: (src: string, width: number, height: number) => void;

  // Uložení a export
  saveTemplate: () => void;
  getExportData: () => TemplateExportData;
  getPlaceholders: () => string[];

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  addToHistory: (elements: CanvasElement[]) => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface EditorProviderProps {
  children: ReactNode;
  /** Callback při uložení šablony */
  onSave?: (data: TemplateExportData) => void;
  /** Počáteční data (pro editaci existující šablony) */
  initialData?: TemplateExportData;
}

export function EditorProvider({ children, onSave, initialData }: EditorProviderProps) {
  // Stav prvků
  const [elements, setElements] = useState<CanvasElement[]>(initialData?.elements ?? []);

  // Stav výběru (Multi-select)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Stav zoomu a panningu
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<PanState>({ x: 0, y: 0 });

  // Undo/Redo hook
  const { undo: undoHook, redo: redoHook, canUndo, canRedo, addToHistory } = useUndoRedo({
    initialElements: initialData?.elements ?? [],
  });

  // ==========================================================================
  // HELPERS PRO VÝBĚR (COMPUTED VALUES)
  // ==========================================================================

  // Zpětná kompatibilita: selectedId vrátí string jen pokud je vybrán právě jeden prvek.
  // Jinak vrátí null (takže se skryjí sidebary).
  const selectedId = useMemo(() => {
    return selectedIds.length === 1 && selectedIds[0] ? selectedIds[0] : null;
  }, [selectedIds]);

  const selectedElement = useMemo(
    () => {
      if (selectedIds.length !== 1) return null;
      return elements.find(el => el.id === selectedIds[0]) ?? null;
    },
    [elements, selectedIds]
  );

  // Wrapper pro nastavení jednoho ID (kompatibilita)
  const setSelectedId = useCallback((id: string | null) => {
    if (id === null) {
      setSelectedIds([]);
    } else {
      setSelectedIds([id]);
    }
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // ==========================================================================
  // UNDO / REDO
  // ==========================================================================

  const undo = useCallback(() => {
    const previousElements = undoHook();
    if (previousElements) {
      setElements(previousElements);
      // Po undo raději zrušíme výběr, abychom nevybírali neexistující prvky
      // (Nebo bychom museli filtrovat selectedIds podle nových elements)
      setSelectedIds([]);
    }
  }, [undoHook]);

  const redo = useCallback(() => {
    const nextElements = redoHook();
    if (nextElements) {
      setElements(nextElements);
      setSelectedIds([]);
    }
  }, [redoHook]);

  // ==========================================================================
  // SPRÁVA PRVKŮ
  // ==========================================================================

  /** Přidá nový prvek */
  const addElement = useCallback((element: CanvasElement, shouldSelect = false) => {
    setElements(prev => {
      const newElements = [...prev, element];
      addToHistory(newElements);
      return newElements;
    });
    if (shouldSelect) {
      setSelectedIds([element.id]);
    }
  }, [addToHistory]);

  /** Aktualizuje vlastnosti prvku */
  const updateElement = useCallback((id: string, updates: AnyElementUpdate, saveHistory = false) => {
    setElements(prev => {
      const newElements = prev.map(el => (el.id === id ? { ...el, ...updates } as CanvasElement : el));

      if (saveHistory) {
        addToHistory(newElements);
      }

      return newElements;
    });
  }, [addToHistory]);

  /** Smaže konkrétní prvek (legacy) */
  const deleteElement = useCallback((id: string) => {
    setElements(prev => {
      if (!prev.find(el => el.id === id)) return prev;
      const newElements = prev.filter(el => el.id !== id);
      addToHistory(newElements);
      return newElements;
    });
    // Pokud byl smazaný prvek ve výběru, odebereme ho
    setSelectedIds(prev => prev.filter(itemId => itemId !== id));
  }, [addToHistory]);

  /** Smaže všechny vybrané prvky */
  const deleteSelectedElements = useCallback(() => {
    if (selectedIds.length === 0) return;

    setElements(prev => {
      const newElements = prev.filter(el => !selectedIds.includes(el.id));
      // Pokud se nic nezměnilo (teoreticky nemožné), neukládáme historii
      if (newElements.length === prev.length) return prev;

      addToHistory(newElements);
      return newElements;
    });
    setSelectedIds([]);
  }, [selectedIds, addToHistory]);

  /** Přeuspořádá prvky (pro vrstvy) */
  const reorderElements = useCallback((fromIndex: number, toIndex: number) => {
    setElements(prev => {
      const result = [...prev];
      const [removed] = result.splice(fromIndex, 1);
      if (removed) {
        result.splice(toIndex, 0, removed);
      }
      addToHistory(result);
      return result;
    });
  }, [addToHistory]);

  // ==========================================================================
  // TOVÁRNÍ METODY PRO VYTVÁŘENÍ PRVKŮ
  // ==========================================================================

  /** Generuje unikátní ID */
  const generateId = () => `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  /** Vytvoří textový prvek */
  const createTextElement = useCallback(() => {
    const id = generateId();
    const position = getCenteredPosition(DEFAULT_TEXT_ELEMENT.width, DEFAULT_TEXT_ELEMENT.height);
    const elementCount = elements.filter(el => el.type === 'text').length + 1;

    const element: TextElement = {
      ...DEFAULT_TEXT_ELEMENT,
      id,
      x: position.x,
      y: position.y,
      name: `Text ${elementCount}`,
    };

    addElement(element);
  }, [elements, addElement]);

  /** Vytvoří placeholder prvek */
  const createPlaceholderElement = useCallback((placeholderKey: string) => {
    const id = generateId();
    const position = getCenteredPosition(
      DEFAULT_PLACEHOLDER_ELEMENT.width,
      DEFAULT_PLACEHOLDER_ELEMENT.height
    );
    const elementCount = elements.filter(el => el.type === 'placeholder').length + 1;

    const element: PlaceholderElement = {
      ...DEFAULT_PLACEHOLDER_ELEMENT,
      id,
      x: position.x,
      y: position.y,
      placeholderKey,
      displayText: `{{${placeholderKey}}}`,
      name: `Proměnná ${elementCount}`,
    };

    addElement(element);
  }, [elements, addElement]);

  /** Vytvoří tvarový prvek */
  const createShapeElement = useCallback((shapeType: ShapeType) => {
    const id = generateId();
    // Určení, zda je tvar definován středem
    const isCenteredShape = [
      'circle', 'ellipse', 'wedge', 'arc', 'ring', 'star', 'regularPolygon',
    ].includes(shapeType);

    // Výpočet pozice
    let finalX, finalY;

    if (isCenteredShape) {
      const centerPos = getCenteredPosition(0, 0);
      finalX = centerPos.x;
      finalY = centerPos.y;
    } else if (shapeType === 'arrow' || shapeType === 'line') {
      const centerPos = getCenteredPosition(100, 0);
      finalX = centerPos.x;
      finalY = centerPos.y;
    }
    else if (shapeType === 'triangle') {
      const centerPos = getCenteredPosition(0, 0);
      finalX = centerPos.x;
      finalY = centerPos.y + 12.5;
    }
    else {
      const pos = getCenteredPosition(DEFAULT_SHAPE_ELEMENT.width, DEFAULT_SHAPE_ELEMENT.height);
      finalX = pos.x;
      finalY = pos.y;
    }

    // Názvy tvarů v češtině
    const SHAPE_NAMES: Record<ShapeType, string> = {
      rect: 'Obdélník',
      square: 'Čtverec',
      circle: 'Kruh',
      ellipse: 'Elipsa',
      triangle: 'Trojúhelník',
      star: 'Hvězda',
      ring: 'Prstenec',
      wedge: 'Výseč',
      arc: 'Oblouk',
      arrow: 'Šipka',
      line: 'Čára',
      regularPolygon: 'Mnohoúhelník'
    };

    // Počet prvků daného typu
    const specificShapeCount = elements.filter(
      el => el.type === 'shape' && el.shapeType === shapeType
    ).length + 1;

    // Specifické vlastnosti pro různé tvary
    let shapeSpecificProps: Partial<ShapeElement> = {};

    switch (shapeType) {
      case 'star':
        shapeSpecificProps = { numPoints: 5, innerRadius: 20, outerRadius: 50 };
        break;
      case 'regularPolygon':
        shapeSpecificProps = { sides: 6 };
        break;
      case 'triangle':
        shapeSpecificProps = { sides: 3 };
        break;
      case 'ring':
        shapeSpecificProps = { innerRadius: 30, outerRadius: 50 };
        break;
      case 'ellipse':
        shapeSpecificProps = { width: 120, height: 60 };
        break;
      case 'arc':
        shapeSpecificProps = { angle: 120, innerRadius: 40, outerRadius: 60 };
        break;
      case 'wedge':
        shapeSpecificProps = { angle: 60, innerRadius: 0, outerRadius: 50 };
        break;
      case 'arrow':
        shapeSpecificProps = { points: [0, 0, 100, 0], pointerLength: 15, pointerWidth: 15 };
        break;
      case 'line':
        shapeSpecificProps = { points: [0, 0, 100, 0] };
        break;
      case 'rect':
        shapeSpecificProps = { width: 200, height: 100 };
        break;
      case 'square':
        shapeSpecificProps = { width: 100, height: 100 };
        break;
    }

    const element: ShapeElement = {
      ...DEFAULT_SHAPE_ELEMENT,
      ...shapeSpecificProps,
      id,
      x: finalX,
      y: finalY,
      shapeType,
      name: `${SHAPE_NAMES[shapeType]} ${specificShapeCount}`,
    };

    addElement(element);
  }, [elements, addElement]);


  /** Vytvoří obrázkový prvek */
  const createImageElement = useCallback((src: string, originalWidth: number, originalHeight: number) => {
    const id = generateId();

    const maxWidth = CANVAS_WIDTH * 0.5;
    const maxHeight = CANVAS_HEIGHT * 0.5;
    const scale = Math.min(maxWidth / originalWidth, maxHeight / originalHeight, 1);

    const width = originalWidth * scale;
    const height = originalHeight * scale;
    const position = getCenteredPosition(width, height);
    const elementCount = elements.filter(el => el.type === 'image').length + 1;

    const element: ImageElement = {
      ...DEFAULT_IMAGE_ELEMENT,
      id,
      x: position.x,

      y: position.y,
      width,
      height,
      src,
      originalWidth,
      originalHeight,
      name: `Obrázek ${elementCount}`,
    };

    addElement(element, false);
  }, [elements, addElement]);

  // ==========================================================================
  // ZOOM A VIEW
  // ==========================================================================

  /** Reset pohledu na výchozí */
  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // ==========================================================================
  // EXPORT A ULOŽENÍ
  // ==========================================================================

  /** Získá seznam všech placeholderů */
  const getPlaceholders = useCallback((): string[] => {
    return elements
      .filter((el): el is PlaceholderElement => el.type === 'placeholder')
      .map(el => el.placeholderKey);
  }, [elements]);

  /** Získá data pro export */
  const getExportData = useCallback((): TemplateExportData => {
    return {
      version: '1.0',
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
      elements,
      placeholders: getPlaceholders(),
    };
  }, [elements, getPlaceholders]);

  /** Uloží šablonu */
  const saveTemplate = useCallback(() => {
    const data = getExportData();
    console.log('Ukládám šablonu:', data);
    if (onSave) {
      onSave(data);
    }
  }, [getExportData, onSave]);

  // ==========================================================================
  // CONTEXT VALUE
  // ==========================================================================

  const contextValue: EditorContextType = {
    // Prvky
    elements,
    setElements,
    addElement,
    updateElement,
    deleteElement,
    deleteSelectedElements,
    reorderElements,

    // Výběr (Multi-select)
    selectedIds,
    setSelectedIds,
    toggleSelection,
    clearSelection,

    // Zpětná kompatibilita
    selectedId,
    setSelectedId,
    selectedElement,

    // Zoom a pan
    zoom,
    setZoom,
    pan,
    setPan,
    resetView,

    // Tovární metody
    createTextElement,
    createPlaceholderElement,
    createShapeElement,
    createImageElement,

    // Export
    saveTemplate,
    getExportData,
    getPlaceholders,

    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo,
    addToHistory,
  };

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}

// =============================================================================
// HOOK PRO POUŽITÍ KONTEXTU
// =============================================================================

export function useEditorContext() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorContext must be used within EditorProvider');
  }
  return context;
}