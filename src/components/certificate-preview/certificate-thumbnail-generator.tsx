"use client";

import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect } from "react-konva";
import type Konva from "konva";
import {
  type CanvasElement,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type ImageElement,
} from "@/components/editor/types/canvas-types";
import { ReadOnlyCanvasElement } from "./read-only-canvas-element";

interface CertificateThumbnailGeneratorProps {
  elements: CanvasElement[];
  onGenerate: (data: {
    certificateUrl: string;
    thumbnailImageUrl: string;
  }) => void;
}

export function CertificateThumbnailGenerator({
  elements,
  onGenerate,
}: CertificateThumbnailGeneratorProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // 1. Přednačtení obrázků, aby byly připravené pro zachycení
  useEffect(() => {
    let isMounted = true;

    const loadImages = async () => {
      const imageElements = elements.filter(
        (el): el is ImageElement => el.type === "image",
      );

      if (imageElements.length === 0) {
        if (isMounted) setImagesLoaded(true);
        return;
      }

      const promises = imageElements.map((el) => {
        return new Promise<void>((resolve) => {
          const img = new window.Image();
          img.src = el.src;
          img.crossOrigin = "anonymous";
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Pokračujeme i při chybě
        });
      });

      await Promise.all(promises);
      if (isMounted) setImagesLoaded(true);
    };

    void loadImages();

    return () => {
      isMounted = false;
    };
  }, [elements]);

  // 2. Zachycení stage po načtení obrázků a vykreslení
  useEffect(() => {
    if (imagesLoaded && stageRef.current) {
      // Dáme Konvě chvíli na kompletní vykreslení scény
      const timeout = setTimeout(() => {
        if (stageRef.current) {
          try {
            const certificateUrl = stageRef.current.toDataURL({
              pixelRatio: 1, // Export v poměru 1:1
              mimeType: "image/png",
            });
            const thumbnailImageUrl = stageRef.current.toDataURL({
              pixelRatio: 0.3,
              mimeType: "image/jpeg",
              quality: 0.5,
            });
            onGenerate({ certificateUrl, thumbnailImageUrl });
          } catch (e) {
            console.error("Nepodařilo se vygenerovat náhled", e);
            onGenerate({ certificateUrl: "", thumbnailImageUrl: "" });
          }
        }
      }, 100); // 100ms zpoždění by mělo stačit po načtení obrázků

      return () => clearTimeout(timeout);
    }
  }, [imagesLoaded, onGenerate]);

  if (!imagesLoaded) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: -10000,
        left: -10000,
        visibility: "hidden",
      }}
    >
      <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT} ref={stageRef}>
        <Layer>
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="#ffffff"
          />
          {elements.map((element) => (
            <ReadOnlyCanvasElement key={element.id} element={element} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
