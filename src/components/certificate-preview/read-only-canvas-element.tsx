"use client";

import React from "react";
import {
  Text,
  Rect,
  Circle,
  Ellipse,
  Wedge,
  Line,
  Arrow,
  Arc,
  Ring,
  Star,
  RegularPolygon,
  Image as KonvaImage,
} from "react-konva";
import useImage from "use-image";
import type {
  CanvasElement,
  ImageElement,
} from "@/components/editor/types/canvas-types";

interface ReadOnlyCanvasElementProps {
  element: CanvasElement;
}

// =============================================================================
// IMAGE ELEMENT
// =============================================================================

function ReadOnlyImageElement({
  element,
  commonProps,
}: {
  element: ImageElement;
  commonProps: Record<string, unknown>;
}) {
  const crossOrigin = element.src.startsWith("data:") ? undefined : "anonymous";
  const [image, status] = useImage(element.src, crossOrigin);

  if (status === "loading") return null;
  if (status === "failed") return null;

  return <KonvaImage {...commonProps} image={image} />;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ReadOnlyCanvasElement({ element }: ReadOnlyCanvasElementProps) {
  const commonProps = {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    scaleX: element.scaleX ?? 1,
    scaleY: element.scaleY ?? 1,
    opacity: element.opacity,
    draggable: false,
    listening: false, // Vypne interakci
    visible: element.visible,
  };

  // 1. TEXT & PLACEHOLDER
  if (element.type === "text" || element.type === "placeholder") {
    // Pro náhledy placeholder vykreslíme jako normální text (již by měl mít nahrazený text)
    // Pokud je to stále placeholder typ, použijeme displayText, jinak text
    const textStr =
      element.type === "text" ? element.text : element.displayText;

    return (
      <Text
        {...commonProps}
        text={textStr}
        fontSize={element.fontSize}
        fontFamily={element.fontFamily}
        fontStyle={element.fontStyle}
        textDecoration={element.textDecoration}
        align={element.align}
        fill={element.fill}
        wrap="word"
      />
    );
  }

  // 2. SHAPE
  if (element.type === "shape") {
    const shapeEl = element;
    const shapeProps = {
      ...commonProps,
      fill: shapeEl.fill,
      stroke: shapeEl.stroke,
      strokeWidth: shapeEl.strokeWidth,
    };

    switch (shapeEl.shapeType) {
      case "rect":
      case "square":
        return <Rect {...shapeProps} />;
      case "circle":
        return (
          <Circle
            {...shapeProps}
            radius={shapeEl.width / 2}
            x={shapeEl.x}
            y={shapeEl.y}
          />
        );
      case "ellipse":
        return (
          <Ellipse
            {...shapeProps}
            radiusX={shapeEl.width / 2}
            radiusY={shapeEl.height / 2}
            x={shapeEl.x}
            y={shapeEl.y}
          />
        );
      case "wedge":
        return (
          <Wedge
            {...shapeProps}
            radius={shapeEl.outerRadius ?? 50}
            angle={shapeEl.angle ?? 60}
            x={shapeEl.x}
            y={shapeEl.y}
          />
        );
      case "line":
        return (
          <Line {...shapeProps} points={shapeEl.points ?? [0, 0, 100, 100]} />
        );
      case "arrow":
        return (
          <Arrow
            {...shapeProps}
            points={shapeEl.points ?? [0, 0, 100, 100]}
            pointerLength={shapeEl.pointerLength}
            pointerWidth={shapeEl.pointerWidth}
          />
        );
      case "arc":
        return (
          <Arc
            {...shapeProps}
            angle={shapeEl.angle ?? 180}
            innerRadius={shapeEl.innerRadius ?? 0}
            outerRadius={shapeEl.outerRadius ?? 50}
            x={shapeEl.x}
            y={shapeEl.y}
          />
        );
      case "ring":
        return (
          <Ring
            {...shapeProps}
            innerRadius={shapeEl.innerRadius ?? 20}
            outerRadius={shapeEl.outerRadius ?? 50}
            x={shapeEl.x}
            y={shapeEl.y}
          />
        );
      case "star":
        return (
          <Star
            {...shapeProps}
            numPoints={shapeEl.numPoints ?? 5}
            innerRadius={shapeEl.innerRadius ?? 20}
            outerRadius={shapeEl.outerRadius ?? 50}
            x={shapeEl.x}
            y={shapeEl.y}
          />
        );
      case "regularPolygon":
        return (
          <RegularPolygon
            {...shapeProps}
            sides={shapeEl.sides ?? 6}
            radius={shapeEl.width / 2}
            x={shapeEl.x}
            y={shapeEl.y}
          />
        );
      case "triangle":
        return (
          <RegularPolygon
            {...shapeProps}
            sides={3}
            radius={shapeEl.width / 2}
            x={shapeEl.x}
            y={shapeEl.y}
          />
        );
      default:
        return <Rect {...shapeProps} fill="#ccc" />;
    }
  }

  // 3. IMAGE
  if (element.type === "image") {
    return <ReadOnlyImageElement element={element} commonProps={commonProps} />;
  }

  return null;
}
