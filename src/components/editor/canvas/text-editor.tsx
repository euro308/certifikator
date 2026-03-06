"use client";

import { useRef, useEffect } from "react";
import { Html } from "react-konva-utils";
import type Konva from "konva";

interface TextEditorProps {
  textNode: Konva.Text;
  onClose: () => void;
  onChange: (newText: string, newHeight: number) => void;
  initialValue?: string;
}

function TextArea({
  textNode,
  onClose,
  onChange,
  initialValue,
}: TextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const textPosition = textNode.position();
    const textWidth = textNode.width();
    const fontSize = textNode.fontSize();
    const lineHeight = textNode.lineHeight();

    // Nastavení hodnoty
    textarea.value = initialValue ?? textNode.text();

    // Pozice a rozměry
    textarea.style.position = "absolute";
    textarea.style.top = `${textPosition.y}px`;
    textarea.style.left = `${textPosition.x}px`;
    textarea.style.width = `${textWidth}px`;
    textarea.style.maxWidth = `${textWidth}px`;

    // Fonty
    textarea.style.fontSize = `${fontSize}px`;
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.lineHeight = String(lineHeight);
    textarea.style.textAlign = textNode.align();
    textarea.style.color = textNode.fill() as string;

    // Layout
    textarea.style.padding = "0px";
    textarea.style.margin = "0px";
    textarea.style.border = "none";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.background = "none";

    // Word wrap
    textarea.style.whiteSpace = "pre-wrap";
    textarea.style.overflowWrap = "break-word";

    // Scroll
    textarea.style.overflow = "hidden";
    textarea.style.overflowY = "hidden";

    // Transform
    textarea.style.transformOrigin = "left top";
    const rotation = textNode.rotation();
    const scaleX = textNode.scaleX();
    const scaleY = textNode.scaleY();

    let transformStr = "";
    if (rotation) transformStr += `rotateZ(${rotation}deg) `;
    if (scaleX !== 1 || scaleY !== 1)
      transformStr += `scale(${scaleX}, ${scaleY})`;

    if (transformStr) {
      textarea.style.transform = transformStr.trim();
    }

    // Auto-resize výšky
    const updateHeight = () => {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;

      // Minimální výška = 1 řádek
      const minHeight = Math.ceil(fontSize * lineHeight);
      const finalHeight = Math.max(scrollHeight, minHeight);
      const totalHeight =
        finalHeight === textNode.fontSize() * 2
          ? textNode.fontSize()
          : finalHeight;

      textarea.style.height = `${totalHeight}px`;
    };

    // Počáteční výška
    updateHeight();
    textarea.focus();
    textarea.select();

    // Handlery

    const saveAndClose = () => {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;

      // Minimální výška = 1 řádek
      const minHeight = Math.ceil(fontSize * lineHeight);
      const finalHeight = Math.max(scrollHeight, minHeight);
      const totalHeight =
        finalHeight === textNode.fontSize() * 2
          ? textNode.fontSize()
          : finalHeight;

      onChange(textarea.value, totalHeight);
      onClose();
    };

    const handleOutsideClick = (e: MouseEvent) => {
      if (e.target !== textarea) {
        saveAndClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape - zavřít
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        saveAndClose();
      }

      // Ctrl+Enter - uložit a zavřít
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        saveAndClose();
      }
    };

    const handleInput = () => {
      updateHeight();
    };

    // Posluchače
    textarea.addEventListener("keydown", handleKeyDown);
    textarea.addEventListener("input", handleInput);

    setTimeout(() => {
      window.addEventListener("click", handleOutsideClick);
    }, 100);

    return () => {
      textarea.removeEventListener("keydown", handleKeyDown);
      textarea.removeEventListener("input", handleInput);
      window.removeEventListener("click", handleOutsideClick);
    };
  }, [textNode, onChange, onClose, initialValue]);

  return (
    <textarea
      ref={textareaRef}
      style={{
        minHeight: "1em",
        position: "absolute",
      }}
    />
  );
}

export function TextEditor(props: TextEditorProps) {
  return (
    <Html>
      <TextArea {...props} />
    </Html>
  );
}
