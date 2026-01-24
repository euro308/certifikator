// =============================================================================
// EDITOR SIDEBAR - Levý panel s nástroji
// =============================================================================

'use client';

import { ScrollArea } from '@/components/ui/scroll-area';

import { TextFormattingSection } from './sidebar/text-formatting-section';
import { AddElementSection } from './sidebar/add-element-section';
import { AddShapeSection } from './sidebar/add-shape-section';
import { ShapePropertiesSection } from './sidebar/shape-properties-section';
import { LayersSection } from './sidebar/layers-section';

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
    <div className="w-72 flex-shrink-0 border-r bg-background">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">

          {/* SEKCE: Přidat prvek */}
          <AddElementSection />
          <AddShapeSection />

          <div className="my-4 border-t" />

          {/* SEKCE: Formátování textu (zobrazí se při výběru textu) */}
          <TextFormattingSection />
          <ShapePropertiesSection />

          <div className="my-4 border-t" />

          {/* SEKCE: Vrstvy */}
          <LayersSection />

          {/* Placeholder pro další sekce */}
          <div className="pt-4 border-t text-center text-muted-foreground">
            <p className="text-xs">(další nástroje budou doplněny)</p>
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}
