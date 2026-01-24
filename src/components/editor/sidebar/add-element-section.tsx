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
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[Image Upload] handleFileChange triggered");
    const file = event.target.files?.[0];
    if (!file) {
      console.log("[Image Upload] No file selected");
      return;
    }

    console.log("[Image Upload] File selected:", file.name, file.type, file.size);

    // Kontrola typu souboru
    if (!file.type.startsWith("image/")) {
      alert("Vybraný soubor není obrázek.");
      return;
    }

    // Načíst obrázek jako Base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      console.log("[Image Upload] FileReader loaded, base64 length:", base64?.length);

      // Získat rozměry obrázku
      const img = new window.Image();
      img.onload = () => {
        console.log("[Image Upload] Image dimensions:", img.width, "x", img.height);
        console.log("[Image Upload] Calling createImageElement...");
        createImageElement(base64, img.width, img.height);
        console.log("[Image Upload] createImageElement called successfully");
      };
      img.onerror = (err) => {
        console.error("[Image Upload] Image load error:", err);
        alert("Nepodařilo se načíst obrázek.");
      };
      img.src = base64;
    };
    reader.onerror = (err) => {
      console.error("[Image Upload] FileReader error:", err);
      alert("Nepodařilo se přečíst soubor.");
    };
    reader.readAsDataURL(file);

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
