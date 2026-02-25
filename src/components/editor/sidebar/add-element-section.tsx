// =============================================================================
// ADD ELEMENT SECTION - Sekce pro přidávání nových prvků
// =============================================================================

"use client";

import { Type, Braces, ChevronDown, ChevronRight, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorContext } from "../editor-context";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import React, { useState, useRef } from "react";
import { toast } from "sonner";
import { downscaleImage } from "@/lib/image-downscaler";

/**
 * Sekce pro přidání nových prvků na plátno
 *
 * Obsahuje tlačítka pro:
 * - Přidat text
 * - Přidat placeholder
 * - Přidat obrázek
 */
export function AddElementSection() {
  const { createTextElement, createPlaceholderElement, createImageElement } =
    useEditorContext();
  const [isOpen, setIsOpen] = useState(true);

  // Ref pro skrytý file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddPlaceholder = () => {
    createPlaceholderElement("Proměnná");
  };

  /**
   * Otevře dialog pro výběr souboru
   */
  const handleAddImageClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Zpracuje vybraný soubor a vytvoří ImageElement
   */
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Kontrola typu souboru
    if (!file.type.startsWith("image/")) {
      toast.error("Vybraný soubor není obrázek.");
      return;
    }

    // Zpracování obrázku s použitím downscaleru a toast promise
    toast.promise(
      downscaleImage(file, { maxSizeMB: 20, maxWidth: 3840, maxHeight: 3840 }),
      {
        loading: "Zpracovávám obrázek...",
        success: (result) => {
          createImageElement(result.base64, result.width, result.height);
          return "Obrázek přidán!";
        },
        error: (err) =>
          err instanceof Error
            ? err.message
            : "Nepodařilo se zpracovat obrázek.",
      },
    );

    // Reset inputu (aby šlo nahrát stejný soubor znovu)
    event.target.value = "";
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="select-none">
      <div className="space-y-2">
        <CollapsibleTrigger asChild>
          <div className={"flex items-center justify-start gap-1"}>
            {isOpen ? (
              <ChevronDown className={"size-4"} />
            ) : (
              <ChevronRight className={"size-4"} />
            )}
            <h3 className="text-foreground text-sm font-semibold">
              Základní prvky
            </h3>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={createTextElement}
            >
              <Type className="size-4" />
              Přidat text
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={handleAddPlaceholder}
            >
              <Braces className="size-4" />
              Přidat proměnnou
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={handleAddImageClick}
            >
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="size-4" />
              Přidat obrázek
            </Button>

            {/* Skrytý file input pro výběr obrázku */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
