// =============================================================================
// EDITOR CANVAS - Wrapper s dynamic importem pro SSR kompatibilitu
// =============================================================================
// Konva používá browser APIs (window, document), takže musíme
// importovat Konva komponenty dynamicky s ssr: false

"use client";

import { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useEditorContext } from "./editor-context";
import { useKeyboardHandler } from "@/components/editor/hooks/use-keyboard-handler";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  ChevronRight,
  Copy,
  Redo,
  Square,
  Trash,
  Undo,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { KONVA_SHAPES } from "@/components/editor/utils/konva-shapes";

// Dynamický import Konva komponenty BEZ server-side renderování
const EditorCanvasContent = dynamic(
  () =>
    import("./canvas/editor-canvas-content").then(
      (mod) => mod.EditorCanvasContent,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-400">Načítám editor...</div>
      </div>
    ),
  },
);

/**
 * Wrapper komponenta pro Konva plátno
 * Měří velikost kontejneru a předává ji do EditorCanvasContent
 */
export function EditorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const {
    elements,
    zoom,
    deleteElement,
    canUndo,
    canRedo,
    undo,
    redo,
    addElement,
    createShapeElement,
    selectedElement,
  } = useEditorContext();

  // Klávesové zkratky
  useKeyboardHandler();

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


  // Zobrazení zoomu v procentech
  const zoomPercent = Math.round(zoom * 100);

  // Kopírování objektu přes Context Menu
  const copyElement = () => {
    const el = selectedElement;
    if (el) {
      const newId = `el_${Date.now()}_copy`;
      const copy = {
        ...el,
        id: newId,
        x: el.x + 20,
        y: el.y + 20,
        name: `${el.name} (kopie)`,
      };
      addElement(copy);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger className="relative flex h-full flex-1 flex-col">
        <div
          ref={containerRef}
          className="relative flex-1 overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-900"
          style={{ minHeight: "400px" }}
        >
          {/* Debug info */}
          <div className="absolute top-2 right-2 z-10 rounded bg-white/80 px-2 py-1 text-xs text-gray-500 select-none dark:bg-black/50 dark:text-gray-400">
            Prvků: {elements.length} | Zoom: {zoomPercent}%
          </div>

          {/* Konva Canvas - načteno dynamicky */}
          {containerSize.width > 0 && containerSize.height > 0 && (
            <EditorCanvasContent
              containerWidth={containerSize.width}
              containerHeight={containerSize.height}
            />
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        <ContextMenuGroup>
          {/* Ukázat pouze, když je hover na plátně */}
          {!selectedElement && (
            <ContextMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex justify-between items-center w-full">
                  <span className="flex items-center gap-2">
                    <Square className="size-4" />
                    Přidat tvar
                  </span>
                    <ChevronRight className="size-4 opacity-50" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" side="right" align="start">
                  <DropdownMenuLabel>Základní tvary</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-[300px] overflow-y-auto">
                    {KONVA_SHAPES.map((shape) => (
                      <DropdownMenuItem
                        key={shape.type}
                        onClick={() => createShapeElement(shape.type)}
                        className="cursor-pointer"
                      >
                        {shape.label}
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </ContextMenuItem>
          )}


          {/* Ukáže se pouze, když je hover na nějakém elementu */}
          {selectedElement && (
            <ContextMenuItem onClick={copyElement}>
              <Copy className={"size-4"} color="#000000"/>
              Kopírovat prvek
            </ContextMenuItem>
          )}

          <ContextMenuItem disabled={!canUndo} onClick={undo}>
            <Undo className={"size-4"} color="#000000"/>
            Vrátit změny
          </ContextMenuItem>

          <ContextMenuItem disabled={!canRedo} onClick={redo}>
            <Redo className={"size-4"} color="#000000"/>
            Obnovit změny
          </ContextMenuItem>

          {/* Ukáže se pouze, když je hover na nějakém elementu */}
          {selectedElement && (
            <ContextMenuItem onClick={() => deleteElement(selectedElement.id)}>
              <Trash className={"size-4"} color="#e7000b"/>
              <span className="text-red-600">Smazat prvek</span>
            </ContextMenuItem>
          )}
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}
