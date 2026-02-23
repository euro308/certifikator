import type {
  CanvasElement,
  ShapeType,
} from "@/components/editor/types/canvas-types";

export function isShapeCentered(element: CanvasElement): boolean {
  if (element.type !== "shape") {
    return false;
  }

  // Podle Konva docs: circle-like shapes mají origin ve středu
  const centeredShapes: ShapeType[] = [
    "circle",
    "ellipse",
    "wedge",
    "arc",
    "ring",
    "star",
    "regularPolygon",
    "triangle",
  ];

  return centeredShapes.includes(element.shapeType);
}
