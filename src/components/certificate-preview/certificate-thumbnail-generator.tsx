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
  onGenerate: (dataUrl: string) => void;
}

export function CertificateThumbnailGenerator({
  elements,
  onGenerate,
}: CertificateThumbnailGeneratorProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // 1. Preload images to ensure they are ready for capture
  useEffect(() => {
    let isMounted = true;
    
    const loadImages = async () => {
      const imageElements = elements.filter(
        (el): el is ImageElement => el.type === "image"
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
          img.onerror = () => resolve(); // Proceed even on error
        });
      });

      await Promise.all(promises);
      if (isMounted) setImagesLoaded(true);
    };

    void loadImages();
    
    return () => { isMounted = false; };
  }, [elements]);

  // 2. Capture stage once images are loaded and stage is rendered
  useEffect(() => {
    if (imagesLoaded && stageRef.current) {
      // Give Konva a moment to render the scene completely
      const timeout = setTimeout(() => {
        if (stageRef.current) {
          try {
            const dataUrl = stageRef.current.toDataURL({
              pixelRatio: 1, // 1:1 export
              mimeType: "image/png",
            });
            onGenerate(dataUrl);
          } catch (e) {
            console.error("Failed to generate thumbnail", e);
            // Even if failed, call onGenerate to move to next (maybe with empty string or retry?)
            // For now, let's assume success or just skip
            onGenerate(""); 
          }
        }
      }, 100); // 100ms delay should be enough after images are loaded

      return () => clearTimeout(timeout);
    }
  }, [imagesLoaded, onGenerate]);

  if (!imagesLoaded) return null;

  return (
    <div style={{ position: "absolute", top: -10000, left: -10000, visibility: "hidden" }}>
      <Stage
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        ref={stageRef}
      >
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
