// =============================================================================
// EDITOR CANVAS CONTENT - Vnitřní implementace Konva plátna
// =============================================================================

'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';
import { useEditorContext } from '../editor-context';
import { TextEditor } from './text-editor';
import { CenteringGuides } from './centering-guides';
import { SelectionTransformer } from './selection-transformer';
import { CanvasElementRenderer } from './canvas-element';
import { useSnapToCenter, type ElementBounds } from '../hooks/use-snap-to-center';
import { useCanvasZoom } from '../hooks/use-canvas-zoom';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  type TextElement,
  type ShapeElement,
  type PlaceholderElement,
} from "../types/canvas-types";

interface EditorCanvasContentProps {
  containerWidth: number;
  containerHeight: number;
}

/**
 * Vnitřní obsah plátna s Konva
 */
export function EditorCanvasContent({ containerWidth, containerHeight }: EditorCanvasContentProps) {
  const stageRef = useRef<Konva.Stage>(null);

  // Stav pro editaci textu
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingTextNodeRef = useRef<Konva.Text | null>(null);

  // Stav pro panning
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPosition = useRef<{ x: number; y: number } | null>(null);
  
  // Ref pro drag start pozice (pro multi-select move)
  const dragStartPosRef = useRef<Record<string, { x: number; y: number }>>({});

  // Stav pro Selection Rectangle (Multi-select)
  const [isSelecting, setIsSelecting] = useState(false);
  const isSelectingRef = useRef(false); // Ref pro synchronní kontrolu
  const [selectionRect, setSelectionRect] = useState({
    visible: false,
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  });

  // Kontext editoru
  const { 
    elements, 
    selectedIds, // Používáme selectedIds
    setSelectedIds, 
    toggleSelection,
    updateElement, 
    zoom, 
    setZoom, 
    pan, 
    setPan 
  } = useEditorContext();

  // Hook pro snapping
  const { checkSnap, guides, hideGuides, showGuides } = useSnapToCenter({ elements });

  // ==========================================================================
  // VÝPOČET SCALE A POZICE
  // ==========================================================================

  const padding = 40;
  const availableWidth = containerWidth - padding * 2;
  const availableHeight = containerHeight - padding * 2;
  const baseScale = Math.min(availableWidth / CANVAS_WIDTH, availableHeight / CANVAS_HEIGHT, 1);

  const finalScale = baseScale * zoom;

  const scaledWidth = CANVAS_WIDTH * finalScale;
  const scaledHeight = CANVAS_HEIGHT * finalScale;
  const centerX = (containerWidth - scaledWidth) / 2;
  const centerY = (containerHeight - scaledHeight) / 2;
  const stageX = centerX + pan.x;
  const stageY = centerY + pan.y;

  // ==========================================================================
  // ZOOM - Využívá hook use-canvas-zoom
  // ==========================================================================

  const { handleWheel } = useCanvasZoom({
    stageRef,
    baseScale,
    onZoomChange: setZoom,
    onPanChange: setPan,
    containerWidth,
    containerHeight,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
  });

  // ==========================================================================
  // MOUSE HANDLERS (PANNING & SELECTION)
  // ==========================================================================

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // 1. Middle mouse button -> PANNING
    if (e.evt.button === 1) {
      e.evt.preventDefault();
      setIsPanning(true);
      lastPanPosition.current = { x: e.evt.clientX, y: e.evt.clientY };
      const stage = stageRef.current;
      if (stage) stage.container().style.cursor = 'grabbing';
      return;
    }

    // 2. Left mouse button on EMPTY space -> SELECTION RECT
    // Ignorujeme, pokud klikáme na transformer nebo prvek (to řeší handleElementClick/Drag)
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background';
    
    if (e.evt.button === 0 && clickedOnEmpty) {
      // Zrušíme výběr, pokud nedržíme Shift/Ctrl (standardní chování)
      // Ale pozor: handleStageClick se volá při "click", toto je "mousedown".
      // Pokud tady zrušíme výběr, uživatel neuvidí, že se něco děje, dokud nezačne táhnout.
      // Raději to necháme na handleStageClick pro prosté kliknutí, 
      // a zde pouze připravíme výběr.
      
      const stage = stageRef.current;
      if (!stage) return;
      
      // Získáme pointer relativně k Stage (v souřadnicích scény - Layeru)
      // Použijeme absolutní transformaci a její inverzi pro převod z screen coords do world coords
      const transform = stage.getAbsoluteTransform().copy().invert();
      const pos = transform.point(stage.getPointerPosition()!);
      
      if (pos) {
        setIsSelecting(true);
        isSelectingRef.current = true;
        setSelectionRect({
          visible: true,
          x1: pos.x,
          y1: pos.y,
          x2: pos.x,
          y2: pos.y,
        });
      }
    }
  }, []);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Panning
    if (isPanning && lastPanPosition.current) {
      const dx = e.evt.clientX - lastPanPosition.current.x;
      const dy = e.evt.clientY - lastPanPosition.current.y;
      setPan({
        x: pan.x + dx,
        y: pan.y + dy,
      });
      lastPanPosition.current = { x: e.evt.clientX, y: e.evt.clientY };
      return;
    }

    // Selection Rect
    if (isSelecting) {
      const stage = stageRef.current;
      if (!stage) return;
      
      const transform = stage.getAbsoluteTransform().copy().invert();
      const pos = transform.point(stage.getPointerPosition()!);
      
      if (pos) {
        setSelectionRect(prev => ({
          ...prev,
          x2: pos.x,
          y2: pos.y,
        }));
      }
    }
  }, [isPanning, isSelecting, pan, setPan]);

  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Panning end
    if (isPanning) {
      setIsPanning(false);
      lastPanPosition.current = null;
      const stage = stageRef.current;
      if (stage) stage.container().style.cursor = 'default';
      return;
    }

    // Selection Rect end
    if (isSelecting) {
      setIsSelecting(false);
      isSelectingRef.current = false;
      setSelectionRect(prev => ({ ...prev, visible: false })); // Skryjeme hned

      const stage = stageRef.current;
      if (!stage) return;

      // Pokud byl výběr velmi malý (jen kliknutí), neřešíme ho zde (řeší handleStageClick)
      const dist = Math.sqrt(
        Math.pow(selectionRect.x2 - selectionRect.x1, 2) + 
        Math.pow(selectionRect.y2 - selectionRect.y1, 2)
      );
      
      if (dist < 5) {
        return; 
      }

      // Vypočítat box výběru (normalizovaný na kladnou šířku/výšku)
      const selBox = {
        x: Math.min(selectionRect.x1, selectionRect.x2),
        y: Math.min(selectionRect.y1, selectionRect.y2),
        width: Math.abs(selectionRect.x2 - selectionRect.x1),
        height: Math.abs(selectionRect.y2 - selectionRect.y1),
      };

      const foundIds: string[] = [];
      const layer = stage.findOne('Layer') as Konva.Layer;
      
      if (layer) {
          elements.forEach(el => {
            const node = layer.findOne(`#${el.id}`);
            if (node) {
               // Získáme bounding box elementu relativně k layeru (stejný souřadný systém jako selBox)
               const nodeRect = node.getClientRect({ relativeTo: layer });
               
               // Manuální kontrola průniku (AABB)
               const hasIntersection = !(
                 nodeRect.x > selBox.x + selBox.width ||
                 nodeRect.x + nodeRect.width < selBox.x ||
                 nodeRect.y > selBox.y + selBox.height ||
                 nodeRect.y + nodeRect.height < selBox.y
               );
               
               if (hasIntersection) {
                 foundIds.push(el.id);
               }
            }
          });
      }

      // Shift key logika pro přidání k výběru?
      // Pro jednoduchost teď: výběr nahradí starý výběr, pokud nedržíme Shift/Ctrl
      const isMultiKey = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;

      if (isMultiKey) {
        // Přidáme unikátní
        const newSelection = Array.from(new Set([...selectedIds, ...foundIds]));
        setSelectedIds(newSelection);
      } else {
        setSelectedIds(foundIds);
      }
    }
  }, [isPanning, isSelecting, selectionRect, elements, selectedIds, setSelectedIds]);

  // Global mouse up handling
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isPanning) {
        setIsPanning(false);
        lastPanPosition.current = null;
      }
      if (isSelecting) {
          setIsSelecting(false);
          isSelectingRef.current = false;
          setSelectionRect(prev => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isPanning, isSelecting]);

  // Zamezení kontextového menu
  useEffect(() => {
    const container = stageRef.current?.container();
    if (!container) return;
    const preventContextMenu = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault();
    };
    container.addEventListener('auxclick', preventContextMenu);
    return () => container.removeEventListener('auxclick', preventContextMenu);
  }, []);

  // ==========================================================================
  // TEXT EDITING
  // ==========================================================================

  const handleTextDblClick = useCallback((element: TextElement, e: Konva.KonvaEventObject<MouseEvent>) => {
    const textNode = e.target as Konva.Text;
    editingTextNodeRef.current = textNode;
    setEditingId(element.id);
  }, []);

  const handleTextChange = useCallback((newText: string, newHeight: number) => {
    if (editingId) {
      const element = elements.find(el => el.id === editingId);
      if (!element) return;
      if (element.type === 'text') {
        updateElement(editingId, { text: newText, height: newHeight });
      } else if (element.type === 'placeholder') {
        const cleanKey = newText.replace(/^{{|}}$/g, '');
        updateElement(editingId, { placeholderKey: cleanKey, displayText: `{{${cleanKey}}}`, height: newHeight });
      }
    }
  }, [editingId, elements, updateElement]);

  const handleTextEditorClose = useCallback(() => {
    editingTextNodeRef.current = null;
    setEditingId(null);
  }, []);

  // ==========================================================================
  // TRANSFORM HANDLERS (UPDATED FOR MULTI-SELECT)
  // ==========================================================================
  // Transformace se aplikuje na všechny vybrané uzly přes Transformer.
  // Transformer sám modifikuje properties uzlů (x, y, scaleX, rotation...).
  // My musíme tyto změny promítnout do React state v onTransformEnd.

  const handleTransform = useCallback((id: string, e: Konva.KonvaEventObject<Event>) => {
    // Pro text se dynamicky mění šířka (visual fix) - toto je spíše legacy pro single select text
    // U multi-selectu transformer škáluje scaleX/Y
    const node = e.target;
    if (node.name() === 'Text' && node.scaleX() !== 1) {
       // Optional: live preview logic
    }
  }, []);

  const handleTransformEnd = useCallback(() => {
    // Transformer triggeruje 'transformend' na samotných shapech, ne na transformeru?
    // Ano, Konva posílá event na každý node zvlášť.
    // Takže tento callback bude volán pro každý shape ve výběru.
    // Musíme zjistit ID nodu a aktualizovat ho.
    
    // Ale pozor: CanvasElementRenderer předává `onTransformEnd={(e) => handleTransformEnd(element.id, e)}`
    // Takže musíme upravit signaturu.
  }, []); // Placeholder, see logic below

  const onShapeTransformEnd = useCallback((id: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const element = elements.find(el => el.id === id);
    if (!element) return;

    // Reset scale a update width/height/points
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset node scale (protože ukládáme absolutní rozměry)
    node.scaleX(1);
    node.scaleY(1);

    const updates: any = {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
    };

    if (element.type === 'text' || element.type === 'placeholder') {
      updates.width = Math.max(20, node.width() * scaleX);
      // Výška se u textu dopočítává automaticky nebo ji necháme
      // updates.height = ... 
    } 
    else if (element.type === 'shape' && (element.shapeType === 'line' || element.shapeType === 'arrow')) {
       // Pro čáry/šipky aplikujeme scale na body
        const points = (element as ShapeElement).points ?? [0, 0, 100, 100];
        updates.points = points.map((p: number, i: number) => {
          return i % 2 === 0 ? p * scaleX : p * scaleY;
        });
    }
    else if (element.type === 'image') {
        updates.width = node.width() * scaleX;
        updates.height = node.height() * scaleY;
    }
    else {
        // Shapes
        updates.width = node.width() * scaleX;
        updates.height = node.height() * scaleY;
    }

    updateElement(id, updates);
  }, [elements, updateElement]);

  // ==========================================================================
  // DRAG & DROP + SNAPPING
  // ==========================================================================

  const handleDragStart = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    // Uložíme startovní pozice všech vybraných prvků
    const startPos: Record<string, { x: number; y: number }> = {};
    const layer = e.target.getLayer();
    
    if (selectedIds.includes(id) && layer) {
      selectedIds.forEach(selId => {
        const node = layer.findOne(`#${selId}`);
        if (node) {
          startPos[selId] = { x: node.x(), y: node.y() };
        }
      });
    } else {
      // Pokud táhneme prvek, který není ve výběru (nemělo by se stát při správném UI),
      // tak uložíme jen ten jeden.
       startPos[id] = { x: e.target.x(), y: e.target.y() };
    }
    dragStartPosRef.current = startPos;
  };

  const handleDragMove = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const layer = node.getLayer();
    if (!layer) return;

    // Pokud nemáme vybráno více prvků, použijeme jednoduchou logiku (stávající)
    if (selectedIds.length <= 1) {
        const element = elements.find(el => el.id === id);
        if (!element) return;
        
        const bounds: ElementBounds = {
            x: node.x(),
            y: node.y(),
            width: node.width() * node.scaleX(),
            height: node.height() * node.scaleY(),
            rotation: node.rotation(),
            type: element.type,
            shapeType: element.type === 'shape' ? element.shapeType : undefined
        };
        const result = checkSnap(bounds, id);
        node.position({ x: result.x, y: result.y });
        return;
    }

    // --- MULTI-SELECT LOGIKA ---

    // 1. Zjistíme deltu pohybu taženého prvku oproti jeho startu
    const startPos = dragStartPosRef.current[id];
    if (!startPos) return;

    const currentX = node.x();
    const currentY = node.y();
    
    // Hrubá delta (bez snapu)
    let dx = currentX - startPos.x;
    let dy = currentY - startPos.y;

    // 2. Vypočítáme "Virtual Bounding Box" celé skupiny na nové pozici
    // Projdeme všechny vybrané prvky a zjistíme jejich (hypotetický) bounding box po aplikaci dx, dy
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    selectedIds.forEach(selId => {
      const original = dragStartPosRef.current[selId];
      if (!original) return;
      
      const el = elements.find(item => item.id === selId);
      // Musíme najít Node pro získání šířky/výšky (kvůli scale)
      const n = layer.findOne(`#${selId}`);
      
      if (el && n) {
        // Pozice po posunu
        const newX = original.x + dx;
        const newY = original.y + dy;
        const w = n.width() * n.scaleX();
        const h = n.height() * n.scaleY();
        
        // Normalizace pro výpočet obálky
        // Pro centered shapes (circle) je x/y střed.
        let left = newX;
        let top = newY;
        
        const isCentered = el.type === 'shape' && 
           ['circle', 'ellipse', 'wedge', 'arc', 'ring', 'star', 'regularPolygon', 'triangle'].includes((el as any).shapeType);

        if (isCentered) {
            left = newX - w / 2;
            top = newY - h / 2;
        }

        minX = Math.min(minX, left);
        minY = Math.min(minY, top);
        maxX = Math.max(maxX, left + w);
        maxY = Math.max(maxY, top + h);
      }
    });

    // 3. Zkontrolujeme Snap pro tento "Virtual Group Box"
    const groupBounds: ElementBounds = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        rotation: 0,
        type: 'group', // Fiktivní typ
        shapeType: 'rect' // Chová se jako obdélník (left-top)
    };
    
    // checkSnap vrátí opravené x/y pro levý horní roh groupBounds
    // Do skipIds pošleme celou skupinu, aby se nechytala sama sebe
    const snapResult = checkSnap(groupBounds, 'group-selection'); 
    
    // 4. Vypočítáme "Snap Delta" (rozdíl mezi snapped pozicí a hrubou pozicí)
    const snapDx = snapResult.x - minX;
    const snapDy = snapResult.y - minY;
    
    // Finální delta, kterou aplikujeme na všechny prvky
    const finalDx = dx + snapDx;
    const finalDy = dy + snapDy;

    // 5. Aplikujeme pohyb na všechny vybrané prvky (VČETNĚ toho taženého!)
    selectedIds.forEach(selId => {
       const n = layer.findOne(`#${selId}`);
       const original = dragStartPosRef.current[selId];
       if (n && original) {
           n.position({
               x: original.x + finalDx,
               y: original.y + finalDy
           });
       }
    });
  };

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    hideGuides();
    const layer = e.target.getLayer();
    if (!layer) return;

    // Pokud je vybráno více prvků, musíme aktualizovat všechny
    if (selectedIds.length > 1 && selectedIds.includes(id)) {
        selectedIds.forEach(selId => {
            const node = layer.findOne(`#${selId}`);
            if (node) {
                updateElement(selId, {
                    x: node.x(),
                    y: node.y(),
                });
            }
        });
    } else {
        // Single select update
        const node = e.target;
        updateElement(id, {
            x: node.x(),
            y: node.y(),
        });
    }
  };

  // ==========================================================================
  // CLICK HANDLERS
  // ==========================================================================

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Pokud jsme právě dokončili výběr (selection box), neděláme nic
    // Používáme ref, protože state update může být asynchronní
    if (isSelectingRef.current) return;

    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background';
    if (clickedOnEmpty) {
       // Deselect all
       setSelectedIds([]);
    }
  };

  const handleElementClick = (id: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    
    const isMultiKey = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
    
    if (isMultiKey) {
       toggleSelection(id);
    } else {
       // Pokud kliknu na prvek, který je již součástí výběru (a výběr je větší než 1),
       // nechci zrušit ostatní (abych mohl začít drag).
       // Ale to řeší mousedown/drag start. Click je až po puštění (bez pohybu).
       // Takže pokud kliknu (bez pohybu) na jeden z vybraných, měl bych vybrat JEN ten jeden?
       // Standardní chování: 
       // - Klik na nevybraný -> vybrat jen ten (zrušit ostatní).
       // - Klik na vybraný (součást skupiny) -> vybrat jen ten (zrušit ostatní).
       // - Shift+Klik -> toggle.
       
       // ALE: Pokud kliknu a táhnu (drag), click event se nespustí (jen dragEnd).
       // Takže tady řešíme čistý klik.
       setSelectedIds([id]);
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <Stage
      ref={stageRef}
      width={containerWidth}
      height={containerHeight}
      x={stageX}
      y={stageY}
      scaleX={finalScale}
      scaleY={finalScale}
      onClick={handleStageClick}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Layer>
        {/* Pozadí */}
        <Rect
          name="background"
          x={0}
          y={0}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          fill="#ffffff"
          shadowColor="rgba(0, 0, 0, 0.25)"
          shadowBlur={25}
          shadowOffsetX={0}
          shadowOffsetY={4}
          stroke="#e5e7eb"
          strokeWidth={1}
        />

        {/* Prvky */}
        {elements.map((element) => (
          <CanvasElementRenderer
            key={element.id}
            element={element}
            // isSelected je true, pokud je ID v poli selectedIds
            isSelected={selectedIds.includes(element.id)}
            isEditing={editingId === element.id}
            isPanning={isPanning}
            
            // Callbacky
            onSelect={(id) => { /* handled by onClick directly now */ }}
            onClick={handleElementClick} 
            onDblClick={handleTextDblClick}
            onDragStart={(e) => handleDragStart(element.id, e)} // Přidáno
            onDragMove={(e) => handleDragMove(element.id, e)}
            onDragEnd={handleDragEnd}
            onTransform={handleTransform}
            onTransformEnd={onShapeTransformEnd}
          />
        ))}

        {/* Vodící čáry */}
        <CenteringGuides
          guides={guides}
          canvasWidth={CANVAS_WIDTH}
          canvasHeight={CANVAS_HEIGHT}
        />

        {/* TextEditor */}
        {editingId && editingTextNodeRef.current && (
          <TextEditor
            textNode={editingTextNodeRef.current}
            onChange={handleTextChange}
            onClose={handleTextEditorClose}
            initialValue={
              elements.find(el => el.id === editingId)?.type === 'placeholder'
                ? (elements.find(el => el.id === editingId) as PlaceholderElement).placeholderKey
                : undefined
            }
          />
        )}

        {/* Transformer (Multi-select) */}
        <SelectionTransformer
          editingId={editingId}
          showGuides={showGuides}
          hideGuides={hideGuides}
        />
        
        {/* Selection Rectangle (vizuální reprezentace) */}
        <Rect
          visible={selectionRect.visible}
          x={Math.min(selectionRect.x1, selectionRect.x2)}
          y={Math.min(selectionRect.y1, selectionRect.y2)}
          width={Math.abs(selectionRect.x2 - selectionRect.x1)}
          height={Math.abs(selectionRect.y2 - selectionRect.y1)}
          fill="rgba(59, 130, 246, 0.2)" // Modrá průhledná
          stroke="#3b82f6"
          strokeWidth={1}
          listening={false} // Aby neblokoval eventy
        />
      </Layer>
    </Stage>
  );
}
