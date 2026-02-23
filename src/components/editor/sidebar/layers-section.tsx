// =============================================================================
// ADD SHAPE SECTION - Sekce pro přidávání tvarů
// =============================================================================

"use client";

import {
  ChartPie,
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  ChevronUp,
  Circle,
  CircleDot,
  CircleQuestionMark,
  CornerDownRight,
  Hexagon,
  Image,
  MinusCircle,
  RectangleHorizontal,
  Square,
  Star,
  TextInitial,
  Trash,
  Triangle,
} from "lucide-react";
import { useEditorContext } from "../editor-context";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import React from "react";
import type { CanvasElement } from "@/components/editor/types/canvas-types";

/**
 * Sekce pro správu pořadí prvků na plátně
 */
export function LayersSection() {
  const { reorderElements, elements, deleteElement } = useEditorContext();
  const [isOpen, setIsOpen] = React.useState(true);

  const correctIcon = (el: CanvasElement) => {
    if (el.type === "text" || el.type === "placeholder") {
      return <TextInitial className={"size-4"} />;
    }

    if (el.type === "image") {
      // eslint-disable-next-line jsx-a11y/alt-text
      return <Image className={"size-4"} />;
    }

    if (el.type === "shape") {
      switch (el.shapeType) {
        case "circle":
          return <Circle className={"size-4"} />;
        case "square":
          return <Square className={"size-4"} />;
        case "rect":
          return <RectangleHorizontal className={"size-4"} />;
        case "line":
          return <MinusCircle className={"size-4"} />;
        case "regularPolygon":
          return <Hexagon className={"size-4"} />;
        case "triangle":
          return <Triangle className={"size-4"} />;
        case "wedge":
          return <ChartPie className={"size-4"} />;
        case "ring":
          return <CircleDot className={"size-4"} />;
        case "star":
          return <Star className={"size-4"} />;
        case "arrow":
          return <CornerDownRight className={"size-4"} />;
        case "arc":
        default:
          return <CircleQuestionMark className={"size-4"} />;
      }
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-2 border-t pt-4">
        <CollapsibleTrigger asChild>
          <div className={"flex items-center justify-start gap-1"}>
            {isOpen ? (
              <ChevronDown className={"size-4"} />
            ) : (
              <ChevronRight className={"size-4"} />
            )}
            <h3 className="text-foreground text-sm font-semibold select-none">
              Vrstvy
            </h3>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-2">
            {elements.length === 0 ? (
              <p className="text-muted-foreground text-center text-xs">
                Pro úpravu vrstev nejdříve přidejte prvek.
              </p>
            ) : (
              // ===== REVERSE pro zobrazení (nahoře = vepředu) =====
              [...elements].reverse().map((el) => {
                // Najdi skutečný index v PŮVODNÍM poli
                const realIndex = elements.findIndex((e) => e.id === el.id);
                const isTop = realIndex === elements.length - 1; // Poslední = vepředu
                const isBottom = realIndex === 0; // První = vzadu

                return (
                  <div
                    key={el.id} // ← OPRAVA: key={el.id}
                    className={"flex items-center justify-between"}
                  >
                    <div className={"flex items-center justify-start gap-2"}>
                      {correctIcon(el)}
                      <span
                        className={
                          "max-w-[104px] overflow-hidden text-ellipsis whitespace-nowrap select-none"
                        }
                      >
                        {el.name}
                      </span>
                    </div>

                    <div className={"flex items-center justify-end gap-[6px]"}>
                      {/* ===== POSUNUTÍ NAHORU (směrem k vyšším vrstvám) ===== */}
                      <ChevronUp
                        className={`size-4 transition-colors ${
                          isTop
                            ? "text-muted-foreground cursor-not-allowed"
                            : "hover:text-primary cursor-pointer"
                        }`}
                        onClick={() => {
                          if (!isTop) {
                            reorderElements(realIndex, realIndex + 1);
                          }
                        }}
                      />

                      {/* ===== POSUNUTÍ ÚPLNĚ NAHORU (nejvyšší vrstva) ===== */}
                      <ChevronsUp
                        className={`size-4 transition-colors ${
                          isTop
                            ? "text-muted-foreground cursor-not-allowed"
                            : "hover:text-primary cursor-pointer"
                        }`}
                        onClick={() => {
                          if (!isTop) {
                            reorderElements(realIndex, elements.length - 1);
                          }
                        }}
                      />

                      {/* ===== POSUNUTÍ DOLŮ (směrem k nižším vrstvám) ===== */}
                      <ChevronDown
                        className={`size-4 transition-colors ${
                          isBottom
                            ? "text-muted-foreground cursor-not-allowed"
                            : "hover:text-primary cursor-pointer"
                        }`}
                        onClick={() => {
                          if (!isBottom) {
                            reorderElements(realIndex, realIndex - 1);
                          }
                        }}
                      />

                      {/* ===== POSUNUTÍ ÚPLNĚ DOLŮ (nejnižší vrstva) ===== */}
                      <ChevronsDown
                        className={`size-4 transition-colors ${
                          isBottom
                            ? "text-muted-foreground cursor-not-allowed"
                            : "hover:text-primary cursor-pointer"
                        }`}
                        onClick={() => {
                          if (!isBottom) {
                            reorderElements(realIndex, 0);
                          }
                        }}
                      />

                      {/* ===== SMAZÁNÍ ===== */}
                      <Trash
                        className={
                          "size-4 cursor-pointer transition-colors hover:text-red-600"
                        }
                        color={"#ff0000"}
                        onClick={() => deleteElement(el.id)}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
