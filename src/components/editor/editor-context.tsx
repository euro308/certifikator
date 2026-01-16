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
  ElementUpdate,
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


// =============================================================================
// TYPY KONTEXTU
// =============================================================================


interface EditorContextType {
  // Prvky na plátně
  elements: CanvasElement[];
  setElements: (elements: CanvasElement[]) => void;
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: ElementUpdate) => void;
  deleteElement: (id: string) => void;
  reorderElements: (fromIndex: number, toIndex: number) => void;


  // Výběr
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


  // Stav výběru
  const [selectedId, setSelectedId] = useState<string | null>(null);


  // Stav zoomu a panningu
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<PanState>({ x: 0, y: 0 });


  // Vybraný prvek (memoizovaný)
  const selectedElement = useMemo(
    () => elements.find(el => el.id === selectedId) ?? null,
    [elements, selectedId]
  );


  // ==========================================================================
  // SPRÁVA PRVKŮ
  // ==========================================================================


  /** Přidá nový prvek */
  const addElement = useCallback((element: CanvasElement) => {
    setElements(prev => [...prev, element]);
    setSelectedId(element.id);
  }, []);


  /** Aktualizuje vlastnosti prvku */
  const updateElement = useCallback((id: string, updates: ElementUpdate) => {
    setElements(prev =>
      prev.map(el => (el.id === id ? { ...el, ...updates } as CanvasElement : el))
    );
  }, []);


  /** Smaže prvek */
  const deleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  }, [selectedId]);


  /** Přeuspořádá prvky (pro vrstvy) */
  const reorderElements = useCallback((fromIndex: number, toIndex: number) => {
    setElements(prev => {
      const result = [...prev];
      const [removed] = result.splice(fromIndex, 1);
      if (removed) {
        result.splice(toIndex, 0, removed);
      }
      return result;
    });
  }, []);


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


    const element: PlaceholderElement = {
      ...DEFAULT_PLACEHOLDER_ELEMENT,
      id,
      x: position.x,
      y: position.y,
      placeholderKey,
      displayText: `{{${placeholderKey}}}`,
      name: `Placeholder: ${placeholderKey}`,
    };


    addElement(element);
  }, [addElement]);


  /** Vytvoří tvarový prvek */
  const createShapeElement = useCallback((shapeType: ShapeType) => {
    const id = generateId();
    // Určení, zda je tvar definován středem (např. Kruh, Hvězda) nebo levým horním rohem (Obdélník)
    // Tvary, které se vykreslují od středu:
    const isCenteredShape = [
      'circle', 'ellipse', 'wedge', 'arc', 'ring', 'star', 'regularPolygon',
    ].includes(shapeType);


    // Výpočet pozice
    let finalX, finalY;

    if (isCenteredShape) {
      // Pro centrované tvary chceme střed tvaru přesně ve středu viewportu
      // getCenteredPosition vrací top-left pro rect o dané velikosti, takže musíme přičíst polovinu velikosti zpět,
      // NEBO (lépe) si spočítat střed viewportu přímo.
      // Ale getCenteredPosition už počítá s viewportem a zoomem.
      // getCenteredPosition(w, h) = (stage.width/2 - w/2 - stage.x) / scale
      // Takže pro center stačí zavolat getCenteredPosition(0, 0)
      const centerPos = getCenteredPosition(0, 0);
      finalX = centerPos.x;
      finalY = centerPos.y;
    } else if (shapeType === 'arrow' || shapeType === 'line') {
      // Čáry a šipky mají šířku 100
      const centerPos = getCenteredPosition(100, 0);
      finalX = centerPos.x;
      finalY = centerPos.y;
    }
    else if(shapeType === 'triangle') {
      // Hrál jsem si s tím, dokud se to nedalo na center
      const centerPos = getCenteredPosition(0, 0);
      finalX = centerPos.x;
      finalY = centerPos.y + 12.5;
    }

    else {
      // Pro Rect a jiné top-left tvary:
      // x = center - width/2
      const pos = getCenteredPosition(DEFAULT_SHAPE_ELEMENT.width, DEFAULT_SHAPE_ELEMENT.height);
      finalX = pos.x;
      finalY = pos.y;
    }

    const elementCount = elements.filter(el => el.type === 'shape').length + 1;


    // Specifické vlastnosti pro různé tvary
    let shapeSpecificProps: Partial<ShapeElement> = {};


    switch (shapeType) {
      case 'star':
        shapeSpecificProps = {
          numPoints: 5,
          innerRadius: 20,
          outerRadius: 50,
        };
        break;
      case 'regularPolygon':
        shapeSpecificProps = {
          sides: 6, // Výchozí šestiúhelník
        };
        break;
      case 'triangle':
        shapeSpecificProps = {
          sides: 3,
        };
        break;
      case 'ring':
        shapeSpecificProps = {
          innerRadius: 30,
          outerRadius: 50,
        };
        break;
      case 'ellipse':
        shapeSpecificProps = {
          width: 120,
          height: 60,
        };
        break;
      case 'arc':
        shapeSpecificProps = {
          angle: 120,
          innerRadius: 40,
          outerRadius: 60,
        };
        break;
      case 'wedge':
        shapeSpecificProps = {
          angle: 60,
          innerRadius: 0,
          outerRadius: 50,
        };
        break;
      case 'arrow':
        shapeSpecificProps = {
          points: [0, 0, 100, 0],
          pointerLength: 15,
          pointerWidth: 15,
        };
        break;
      case 'line':
        shapeSpecificProps = {
          points: [0, 0, 100, 0],
        };
        break;
      case 'rect':
        shapeSpecificProps = {
          width: 200,
          height: 100,
        };
        break;
      case 'square':
        shapeSpecificProps = {
          width: 100, // Explicitně stejné jako default, ale pro jistotu
          height: 100,
        };
        break;
    }


    const element: ShapeElement = {
      ...DEFAULT_SHAPE_ELEMENT,
      // Defaulty pro centered tvary (aby x,y dávalo smysl jako střed)
      ...shapeSpecificProps,
      id,
      x: finalX,
      y: finalY,
      shapeType,
      name: `Tvar ${elementCount}`,
    };


    addElement(element);
  }, [elements, addElement]);


  /** Vytvoří obrázkový prvek */
  const createImageElement = useCallback((src: string, originalWidth: number, originalHeight: number) => {
    const id = generateId();

    // Škáluj obrázek, aby se vešel na plátno (max 50% rozměrů plátna)
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


    addElement(element);
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
    reorderElements,


    // Výběr
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