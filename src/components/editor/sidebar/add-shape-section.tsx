// =============================================================================
// ADD SHAPE SECTION - Sekce pro přidávání tvarů
// =============================================================================

"use client";

import { Square, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useEditorContext } from "../editor-context";
import { KONVA_SHAPES } from "@/components/editor/utils/konva-shapes";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import React from "react";

/**
 * Sekce pro přidání tvaru na plátno
 */
export function AddShapeSection() {
  const { createShapeElement } = useEditorContext();
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="select-none">
      <div className="space-y-2 pt-2">
        <CollapsibleTrigger asChild>
          <div className={"flex items-center justify-start gap-1"}>
            {isOpen ? (
              <ChevronDown className={"size-4"} />
            ) : (
              <ChevronRight className={"size-4"} />
            )}
            <h3 className="text-foreground text-sm font-semibold select-none">
              Tvary
            </h3>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Square className="size-4" />
                    Přidat tvar
                  </span>
                  <ChevronRight className="size-4 opacity-50" />
                </Button>
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
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
