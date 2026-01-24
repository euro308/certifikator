// =============================================================================
// TEXT FORMATTING SECTION - Formátování vybraného textu
// =============================================================================

"use client";

import React, { useEffect, useState } from "react";
import { useEditorContext } from "../editor-context";
import {
  AVAILABLE_FONTS,
  type TextElement,
  type FontFamily,
  type TextAlign,
} from "../types/canvas-types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

/**
 * Sekce pro formátování vybraného textu
 * Zobrazuje se pouze když je vybrán textový prvek
 *
 * Logika Bold/Italic/Underline je zde.
 */
export function TextFormattingSection() {
  const { selectedElement, updateElement } = useEditorContext();
  const [isOpen, setIsOpen] = useState(true);

  // ===== LOKÁLNÍ STATE PRO FONT SIZE INPUT =====
  const [fontSizeInput, setFontSizeInput] = useState<string>("");

  // Synchronizuj input s vybraným prvkem
  useEffect(() => {
    if (selectedElement?.type === 'text' || selectedElement?.type === 'placeholder') {
      setFontSizeInput(selectedElement.fontSize.toString());
    }
  }, [selectedElement]);

  // ========== KLÁVESOVÉ ZKRATKY ==========
  useEffect(() => {
    // Zobrazit pouze pro textové prvky
    if (selectedElement?.type !== 'text' && selectedElement?.type !== 'placeholder') {
      return;
    }

    const textElement = selectedElement;

    // ===== TOGGLE FUNKCE UVNITŘ useEffect =====
    const toggleBold = () => {
      const currentStyle = textElement.fontStyle;
      const currentIsBold = currentStyle.includes('bold');
      const currentIsItalic = currentStyle.includes('italic');

      let newStyle: TextElement['fontStyle'];
      if (currentIsBold) {
        newStyle = currentIsItalic ? 'italic' : 'normal';
      } else {
        newStyle = currentIsItalic ? 'italic bold' : 'bold';
      }
      updateElement(textElement.id, { fontStyle: newStyle }, true);
    };

    const toggleItalic = () => {
      const currentStyle = textElement.fontStyle;
      const currentIsBold = currentStyle.includes('bold');
      const currentIsItalic = currentStyle.includes('italic');

      let newStyle: TextElement['fontStyle'];
      if (currentIsItalic) {
        newStyle = currentIsBold ? 'bold' : 'normal';
      } else {
        newStyle = currentIsBold ? 'italic bold' : 'italic';
      }
      updateElement(textElement.id, { fontStyle: newStyle }, true);
    };

    const toggleUnderline = () => {
      const newDecoration = textElement.textDecoration === 'underline' ? '' : 'underline';
      updateElement(textElement.id, { textDecoration: newDecoration }, true);
    };

    // ===== KEYBOARD HANDLER =====
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            toggleBold();
            break;
          case 'i':
            e.preventDefault();
            toggleItalic();
            break;
          case 'u':
            e.preventDefault();
            toggleUnderline();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, updateElement]); // ← DŮLEŽITÉ: dependency array!

  // Zobrazit pouze pro textové prvky
  if (selectedElement?.type !== 'text' && selectedElement?.type !== 'placeholder') {
    return null;
  }

  const textElement = selectedElement as TextElement; // Cast is safe for shared formatting props

  // Pomocné funkce pro style parsing
  const isBold = textElement.fontStyle.includes('bold');
  const isItalic = textElement.fontStyle.includes('italic');
  const isUnderline = textElement.textDecoration === 'underline';

/**
 * Toggle Bold - přepíná mezi normal/bold/italic/italic bold
 * Konva používá 'italic bold' (italic první)
 */
const toggleBold = () => {
  // ... logic
  const currentStyle = textElement.fontStyle;
  const currentIsBold = currentStyle.includes('bold');
  const currentIsItalic = currentStyle.includes('italic');

  let newStyle: TextElement['fontStyle'];
  if (currentIsBold) {
    newStyle = currentIsItalic ? 'italic' : 'normal';
  } else {
    newStyle = currentIsItalic ? 'italic bold' : 'bold';
  }
  updateElement(textElement.id, { fontStyle: newStyle }, true);
};

/**
 * Toggle Italic - přepíná mezi normal/italic/bold/italic bold
 * Konva používá 'italic bold' (italic první)
 */
const toggleItalic = () => {
  // ... logic
  const currentStyle = textElement.fontStyle;
  const currentIsBold = currentStyle.includes('bold');
  const currentIsItalic = currentStyle.includes('italic');

  let newStyle: TextElement['fontStyle'];
  if (currentIsItalic) {
    newStyle = currentIsBold ? 'bold' : 'normal';
  } else {
    newStyle = currentIsBold ? 'italic bold' : 'italic';
  }
  updateElement(textElement.id, { fontStyle: newStyle }, true);
};

/**
 * Toggle Underline
 */
const toggleUnderline = () => {
  const newDecoration = textElement.textDecoration === 'underline' ? '' : 'underline';
  updateElement(textElement.id, { textDecoration: newDecoration }, true);
};

const handleFontChange = (font: string) => {
  updateElement(textElement.id, { fontFamily: font as FontFamily }, true);
};

const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  // ... logic (updates element without history for smooth typing/sliding)
  const value = e.target.value;
  setFontSizeInput(value);
  const size = parseInt(value, 10);

  if (!isNaN(size) && size >= 8 && size <= 200) {
    const oldFontSize = textElement.fontSize;
    const oldHeight = textElement.height;
    const oldWidth = textElement.width;
    const scale = size / oldFontSize;
    const newHeight = Math.round(oldHeight * scale);
    const newWidth = Math.ceil(oldWidth * scale);

    updateElement(textElement.id, {
      fontSize: size,
      height: newHeight,
      width: newWidth,
    }); // Implicit false for history
  }
};

// ===== BLUR HANDLER - fallback na validní hodnotu a COMMIT historie =====
const handleFontSizeBlur = () => {
  const size = parseInt(fontSizeInput, 10);

  if (isNaN(size) || size < 8 || size > 200) {
    setFontSizeInput(textElement.fontSize.toString());
  } else {
    // Valid value - commit to history
    // We re-update with the same value just to trigger history save
    // But we need to calculate other props too if we want to be consistent, but updateElement merges.
    // Actually for history we need full state.
    // Calling updateElement(..., true) does exactly that: new state -> addToHistory.
    updateElement(textElement.id, { fontSize: size }, true);
  }
};

const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  updateElement(textElement.id, { fill: e.target.value });
};

const handleColorBlur = () => {
  // Commit color change
  updateElement(textElement.id, { fill: textElement.fill }, true);
};

const handleAlignChange = (align: TextAlign) => {
  updateElement(textElement.id, { align }, true);
};

return (
  <Collapsible open={isOpen} onOpenChange={setIsOpen}>
    <div className="space-y-3 border-t pt-4">
      <CollapsibleTrigger asChild>
        <div className={"flex justify-start items-center gap-1"}>
          {isOpen ? <ChevronDown className={"size-4"} /> : <ChevronRight className={"size-4"} />}
          <h3 className="text-foreground text-sm font-semibold select-none">
            Formátování textu
          </h3>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3">
        <p className="text-muted-foreground text-xs">
          Dvojklikem na text můžete upravit jeho obsah.
          {selectedElement?.type === 'placeholder' && ' (Proměnná)'}
        </p>

        {/* Font family */}
        <div className="space-y-1.5">
          <Label htmlFor="font-family" className="text-xs">
            Písmo
          </Label>
          <Select value={textElement.fontFamily} onValueChange={handleFontChange}>
            <SelectTrigger id="font-family" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_FONTS.map((font) => (
                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font size */}
        <div className="space-y-1.5">
          <Label htmlFor="font-size" className="text-xs">
            Velikost (px)
          </Label>
          <Input
            id="font-size"
            type="number"
            min={8}
            max={200}
            value={fontSizeInput}
            onChange={handleFontSizeChange}
            onBlur={handleFontSizeBlur}
            className="w-full"
          />
        </div>

        {/* Bold, Italic, Underline */}
        <div className="space-y-1.5">
          <Label className="text-xs">Styl</Label>
          <div className="flex gap-1">
            <Button
              variant={isBold ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={toggleBold}
              title="Tučné (Ctrl+B)"
            >
              <Bold className="size-4" />
            </Button>
            <Button
              variant={isItalic ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={toggleItalic}
              title="Kurzíva (Ctrl+I)"
            >
              <Italic className="size-4" />
            </Button>
            <Button
              variant={isUnderline ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={toggleUnderline}
              title="Podtržené (Ctrl+U)"
            >
              <Underline className="size-4" />
            </Button>
          </div>
        </div>

        {/* Text alignment */}
        <div className="space-y-1.5">
          <Label className="text-xs">Zarovnání</Label>
          <div className="flex gap-1">
            <Button
              variant={textElement.align === "left" ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => handleAlignChange("left")}
              title="Zarovnat vlevo"
            >
              <AlignLeft className="size-4" />
            </Button>
            <Button
              variant={textElement.align === "center" ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => handleAlignChange("center")}
              title="Zarovnat na střed"
            >
              <AlignCenter className="size-4" />
            </Button>
            <Button
              variant={textElement.align === "right" ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => handleAlignChange("right")}
              title="Zarovnat vpravo"
            >
              <AlignRight className="size-4" />
            </Button>
            <Button
              variant={textElement.align === "justify" ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => handleAlignChange("justify")}
              title="Zarovnat do bloku"
            >
              <AlignJustify className="size-4" />
            </Button>
          </div>
        </div>

        {/* Text color */}
        <div className="space-y-1.5">
          <Label htmlFor="text-color" className="flex items-center gap-1 text-xs">
            <Palette className="h-3 w-3" />
            Barva textu
          </Label>
          <div className="flex items-center gap-2">
            <input
              id="text-color"
              type="color"
              value={textElement.fill}
              onChange={handleColorChange}
              className="h-8 w-8 cursor-pointer rounded border"
            />
            <Input
              type="text"
              value={textElement.fill}
              onChange={handleColorChange}
              className="flex-1 font-mono text-xs"
              placeholder="#000000"
            />
          </div>
        </div>
      </CollapsibleContent>
    </div>
  </Collapsible>
);
}
