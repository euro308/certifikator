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
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import {
  ChevronRight,
  Copy,
  Redo,
  Square,
  Trash,
  Undo,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import type { CanvasElement } from "./types/canvas-types";
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
    updateElement,
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
      addElement(copy, true);
    }
  };

  const rotateAroundCenter = (el: CanvasElement, angleDeg: number) => {
    // 1. Najít střed bounding boxu prvku (bez natočení). Konva "x/y" je top-left pro většinu.
    let cx = el.x;
    let cy = el.y;

    if (
      !isCenteredShape(el.type, el.type === "shape" ? el.shapeType : undefined)
    ) {
      // Většina prvků (obdélníky, text, obrázky, line(která je rect)) má origin v top-left
      // Střed v lokálních souřadnicích
      const localCx = (el.width * (el.scaleX ?? 1)) / 2;
      const localCy = (el.height * (el.scaleY ?? 1)) / 2;

      // Natočení aktuálního stavu v radiánech
      const currentRad = (el.rotation * Math.PI) / 180;

      // Pozice středu globálně
      cx =
        el.x + localCx * Math.cos(currentRad) - localCy * Math.sin(currentRad);
      cy =
        el.y + localCx * Math.sin(currentRad) + localCy * Math.cos(currentRad);
    }
    // Pro centralizované prvky (kruhy) je el.x a el.y rovnou střed

    // 2. Nová rotace
    const newRotation = (el.rotation + angleDeg) % 360;

    // Pokud to byla rotace zrovna o +/-90 a máme necentrovaný tvar, musíme najít novou pozici top-left
    let newX = el.x;
    let newY = el.y;

    if (
      !isCenteredShape(el.type, el.type === "shape" ? el.shapeType : undefined)
    ) {
      const newRad = (newRotation * Math.PI) / 180;
      const localCx = (el.width * (el.scaleX ?? 1)) / 2;
      const localCy = (el.height * (el.scaleY ?? 1)) / 2;

      // Vrátíme se od středu zpět nahoru doleva (vzhledem k novému natočení)
      newX = cx - localCx * Math.cos(newRad) + localCy * Math.sin(newRad);
      newY = cy - localCx * Math.sin(newRad) - localCy * Math.cos(newRad);
    }

    // Ošetření záporných rotací (aby to nedávalo -90 ale 270 pro lepší čitelnost)
    const normalizedRotation =
      newRotation < 0 ? 360 + newRotation : newRotation;

    updateElement(el.id, {
      rotation: normalizedRotation,
      x: newX,
      y: newY,
    });
  };

  const rotateLeft = () => {
    if (selectedElement) {
      rotateAroundCenter(selectedElement, -90);
    }
  };

  const rotateRight = () => {
    if (selectedElement) {
      rotateAroundCenter(selectedElement, 90);
    }
  };

  const isCenteredShape = (type: string, shapeType?: string) => {
    if (type !== "shape") return false;
    return [
      "circle",
      "ellipse",
      "wedge",
      "arc",
      "ring",
      "star",
      "regularPolygon",
      "triangle",
    ].includes(shapeType ?? "");
  };

  const flipVertical = () => {
    if (selectedElement) {
      const el: CanvasElement = selectedElement;
      const oldSY = el.scaleY ?? 1;
      const newSY = -oldSY;

      let newX = el.x;
      let newY = el.y;

      if (
        !isCenteredShape(
          el.type,
          el.type === "shape" ? el.shapeType : undefined,
        )
      ) {
        const rad = (el.rotation * Math.PI) / 180;
        newX = el.x - oldSY * el.height * Math.sin(rad);
        newY = el.y + oldSY * el.height * Math.cos(rad);
      }

      updateElement(el.id, {
        scaleY: newSY,
        x: newX,
        y: newY,
      });
    }
  };

  const flipHorizontal = () => {
    if (selectedElement) {
      const el: CanvasElement = selectedElement;
      const oldSX = el.scaleX ?? 1;
      const newSX = -oldSX;

      let newX = el.x;
      let newY = el.y;

      if (
        !isCenteredShape(
          el.type,
          el.type === "shape" ? el.shapeType : undefined,
        )
      ) {
        const rad = (el.rotation * Math.PI) / 180;
        newX = el.x + oldSX * el.width * Math.cos(rad);
        newY = el.y + oldSX * el.width * Math.sin(rad);
      }

      updateElement(el.id, {
        scaleX: newSX,
        x: newX,
        y: newY,
      });
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
          {/* Ukázat pouze, když je hover na plátně (prázdno) */}
          {!selectedElement && (
            <>
              <ContextMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex w-full items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Square className="size-4" />
                        Přidat tvar
                      </span>
                      <ChevronRight className="size-4 opacity-50" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56"
                    side="right"
                    align="start"
                  >
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

              <ContextMenuItem disabled={!canUndo} onClick={undo}>
                <Undo className={"size-4"} color="#000000" />
                Vrátit změny
              </ContextMenuItem>

              <ContextMenuItem disabled={!canRedo} onClick={redo}>
                <Redo className={"size-4"} color="#000000" />
                Obnovit změny
              </ContextMenuItem>
            </>
          )}

          {/* Ukáže se pouze, když je hover na nějakém elementu */}
          {selectedElement && (
            <>
              <ContextMenuItem onClick={copyElement}>
                <Copy className={"size-4"} color="#000000" />
                Kopírovat prvek
              </ContextMenuItem>

              <ContextMenuSub>
                <ContextMenuSubTrigger className="flex items-center gap-2">
                  <RotateCw className="size-4" color="#000000" />
                  <span>Otočit</span>
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  <ContextMenuItem onClick={rotateLeft}>
                    <RotateCcw className="mr-2 size-4" />
                    Otočit o 90° doleva
                  </ContextMenuItem>
                  <ContextMenuItem onClick={rotateRight}>
                    <RotateCw className="mr-2 size-4" />
                    Otočit o 90° doprava
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>

              <ContextMenuSub>
                <ContextMenuSubTrigger className="flex items-center gap-2">
                  <FlipHorizontal className="size-4" color="#000000" />
                  <span>Překlopit</span>
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  <ContextMenuItem onClick={flipVertical}>
                    <FlipVertical className="mr-2 size-4" />
                    Překlopit svisle
                  </ContextMenuItem>
                  <ContextMenuItem onClick={flipHorizontal}>
                    <FlipHorizontal className="mr-2 size-4" />
                    Překlopit vodorovně
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>

              <ContextMenuItem
                onClick={() => deleteElement(selectedElement.id)}
              >
                <Trash className={"size-4"} color="#e7000b" />
                <span className="text-red-600">Smazat prvek</span>
              </ContextMenuItem>
            </>
          )}
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}
