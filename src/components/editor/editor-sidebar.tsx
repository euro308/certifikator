"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

import { TextFormattingSection } from "./sidebar/text-formatting-section";
import { AddElementSection } from "./sidebar/add-element-section";
import { AddShapeSection } from "./sidebar/add-shape-section";
import { ShapePropertiesSection } from "./sidebar/shape-properties-section";
import { LayersSection } from "./sidebar/layers-section";

/**
 * Levý panel editoru
 *
 * Obsahuje:
 * - Přidat prvek (Text, Placeholder)
 * - Formátování textu (zobrazí se při výběru textu)
 * - (další sekce budou doplněny)
 */
export function EditorSidebar() {
  return (
    <div className="bg-background w-72 flex-shrink-0 border-r">
      <ScrollArea className="h-full">
        <div className="space-y-4 p-4">
          {/* Sekce přidat prvek */}
          <AddElementSection />
          <AddShapeSection />

          {/* Sekce formátování textu (zobrazí se při výběru textu) */}
          <TextFormattingSection />

          {/* Sekce vlastnosti tvaru (zobrazí se při výběru tvaru) */}
          <ShapePropertiesSection />

          {/* Sekce vrstvy */}
          <LayersSection />
        </div>
      </ScrollArea>
    </div>
  );
}
