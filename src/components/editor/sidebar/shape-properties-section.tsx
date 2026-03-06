"use client";

import { useEditorContext } from "../editor-context";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import React, { useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

const REGULAR_SHAPES = [
  "square",
  "circle",
  "wedge",
  "arc",
  "ring",
  "star",
  "regularPolygon",
  "triangle",
];

export function ShapePropertiesSection() {
  const { selectedElement, updateElement } = useEditorContext();
  const [isOpen, setIsOpen] = React.useState(true);

  // Lokální state
  const [shapeWidth, setShapeWidth] = useState<string>("");
  const [shapeHeight, setShapeHeight] = useState<string>("");
  const [arrowPointerLength, setArrowPointerLength] = useState<string>("");
  const [arrowPointerWidth, setArrowPointerWidth] = useState<string>("");

  // Synchronizace state
  useEffect(() => {
    if (selectedElement?.type === "shape") {
      setShapeWidth(Math.round(selectedElement.width).toString());
      setShapeHeight(Math.round(selectedElement.height).toString());

      // Pro arrow
      if (selectedElement.shapeType === "arrow") {
        setArrowPointerLength((selectedElement.pointerLength ?? 15).toString());
        setArrowPointerWidth((selectedElement.pointerWidth ?? 15).toString());
      }
    }
  }, [selectedElement]);

  if (selectedElement?.type !== "shape") {
    return null;
  }

  const shape = selectedElement;
  const isRegular = REGULAR_SHAPES.includes(shape.shapeType);
  const isArrow = shape.shapeType === "arrow";

  // Handlery
  const handleFillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateElement(shape.id, { fill: e.target.value });
  };

  const handleFillBlur = () => {
    updateElement(shape.id, { fill: shape.fill }, true);
  };

  const handleAngleChange = (value: number[]) => {
    // Slider - onValueChange is called continuously
    updateElement(shape.id, { angle: value[0] });
  };

  const handleAngleCommit = (value: number[]) => {
    // onValueCommit for Slider (if available in UI component, otherwise we need onPointerUp or similar)
    // Radix UI Slider has onValueCommit.
    updateElement(shape.id, { angle: value[0] }, true);
  };

  const handleStrokeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateElement(shape.id, { stroke: e.target.value });
  };

  const handleStrokeBlur = () => {
    updateElement(shape.id, { stroke: shape.stroke }, true);
  };

  const handleStrokeWidthChange = (value: number[]) => {
    updateElement(shape.id, { strokeWidth: value[0] });
  };

  const handleStrokeWidthCommit = (value: number[]) => {
    updateElement(shape.id, { strokeWidth: value[0] }, true);
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setShapeWidth(value);

    const val = parseInt(value, 10);
    if (!isNaN(val) && val > 0) {
      if (isRegular) {
        updateElement(shape.id, { width: val, height: val });
      } else {
        updateElement(shape.id, { width: val });
      }
    }
  };

  const handleWidthBlur = () => {
    const size = parseInt(shapeWidth, 10);
    if (isNaN(size) || size <= 0) {
      setShapeWidth(shape.width.toString());
    } else {
      // Commit
      if (isRegular) {
        updateElement(shape.id, { width: size, height: size }, true);
      } else {
        updateElement(shape.id, { width: size }, true);
      }
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setShapeHeight(value);

    const val = parseInt(value, 10);
    if (!isNaN(val) && val > 0) {
      if (isRegular) {
        updateElement(shape.id, { width: val, height: val });
      } else {
        updateElement(shape.id, { height: val });
      }
    }
  };

  const handleHeightBlur = () => {
    const size = parseInt(shapeHeight, 10);
    if (isNaN(size) || size <= 0) {
      setShapeHeight(shape.height.toString());
    } else {
      if (isRegular) {
        updateElement(shape.id, { width: size, height: size }, true);
      } else {
        updateElement(shape.id, { height: size }, true);
      }
    }
  };

  // Arrow pointer handlery
  const handlePointerLengthChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setArrowPointerLength(value);

    const val = parseInt(value, 10);
    if (!isNaN(val) && val > 0) {
      updateElement(shape.id, { pointerLength: val });
    }
  };

  const handlePointerLengthBlur = () => {
    const size = parseInt(arrowPointerLength, 10);
    if (isNaN(size) || size <= 0) {
      setArrowPointerLength((shape.pointerLength ?? 15).toString());
    } else {
      updateElement(shape.id, { pointerLength: size }, true);
    }
  };

  const handlePointerWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setArrowPointerWidth(value);

    const val = parseInt(value, 10);
    if (!isNaN(val) && val > 0) {
      updateElement(shape.id, { pointerWidth: val });
    }
  };

  const handlePointerWidthBlur = () => {
    const size = parseInt(arrowPointerWidth, 10);
    if (isNaN(size) || size <= 0) {
      setArrowPointerWidth((shape.pointerWidth ?? 10).toString());
    } else {
      updateElement(shape.id, { pointerWidth: size }, true);
    }
  };

  // Inner radius handler
  const handleInnerRadiusChange = (value: number[]) => {
    updateElement(shape.id, { innerRadius: value[0] });
  };

  const handleInnerRadiusCommit = (value: number[]) => {
    updateElement(shape.id, { innerRadius: value[0] }, true);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-4 border-t pt-4 pb-2">
        <CollapsibleTrigger asChild>
          <div className={"flex items-center justify-start gap-1"}>
            {isOpen ? (
              <ChevronDown className={"size-4"} />
            ) : (
              <ChevronRight className={"size-4"} />
            )}
            <h3 className="text-foreground text-sm font-semibold select-none">
              Vlastnosti tvaru
            </h3>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3">
            {/* Rozměry */}
            {!isArrow && (
              <div className="grid grid-cols-2 gap-2">
                {isRegular ? (
                  <div className="col-span-2 space-y-1">
                    <Label htmlFor="shape-size" className="text-xs">
                      Velikost (px)
                    </Label>
                    <Input
                      id="shape-size"
                      type="number"
                      min={1}
                      value={shapeWidth}
                      onChange={handleWidthChange}
                      onBlur={handleWidthBlur}
                      className="h-8"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="shape-width" className="text-xs">
                        Šířka
                      </Label>
                      <Input
                        id="shape-width"
                        type="number"
                        min={1}
                        value={shapeWidth}
                        onChange={handleWidthChange}
                        onBlur={handleWidthBlur}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="shape-height" className="text-xs">
                        Výška
                      </Label>
                      <Input
                        id="shape-height"
                        type="number"
                        min={1}
                        value={shapeHeight}
                        onChange={handleHeightChange}
                        onBlur={handleHeightBlur}
                        className="h-8"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Úhel - pouze pro Wedge a Arc */}
            {(shape.shapeType === "wedge" || shape.shapeType === "arc") && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Úhel</Label>
                  <span className="text-muted-foreground text-xs">
                    {shape.angle}°
                  </span>
                </div>
                <Slider
                  value={[shape.angle ?? 60]}
                  min={0}
                  max={360}
                  step={1}
                  onValueChange={handleAngleChange}
                  onValueCommit={handleAngleCommit} // Added
                />
              </div>
            )}

            {/* Pointer properties - pouze pro Arrow */}
            {shape.shapeType === "arrow" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="arrow-pointer-width" className="text-xs">
                    Šířka ukazatele
                  </Label>
                  <Input
                    id="arrow-pointer-width"
                    type="number"
                    min={1}
                    value={arrowPointerWidth}
                    onChange={handlePointerWidthChange}
                    onBlur={handlePointerWidthBlur}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="arrow-pointer-length" className="text-xs">
                    Délka ukazatele
                  </Label>
                  <Input
                    id="arrow-pointer-length"
                    type="number"
                    min={1}
                    value={arrowPointerLength}
                    onChange={handlePointerLengthChange}
                    onBlur={handlePointerLengthBlur}
                    className="h-8"
                  />
                </div>
              </div>
            )}

            {/* Radius properties - Arc, Ring, Star */}
            {(shape.shapeType === "arc" ||
              shape.shapeType === "ring" ||
              shape.shapeType === "star") && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Vnitřní rádius</Label>
                  <span className="text-muted-foreground text-xs">
                    {shape.innerRadius} px
                  </span>
                </div>
                <Slider
                  value={[shape.innerRadius ?? 20]}
                  min={0}
                  max={Math.max(100, (shape.innerRadius ?? 50) - 1)}
                  step={1}
                  onValueChange={handleInnerRadiusChange}
                  onValueCommit={handleInnerRadiusCommit} // Added
                />
              </div>
            )}

            {/* Výplň */}
            <div className="space-y-1">
              <Label htmlFor="shape-fill" className="text-xs">
                Barva výplně
              </Label>
              <div className="flex gap-2">
                <input
                  id="fill-color"
                  type="color"
                  value={shape.fill}
                  onChange={handleFillChange}
                  onBlur={handleFillBlur} // Added
                  className="h-8 w-8 cursor-pointer rounded border"
                />
                <Input
                  id="shape-fill"
                  type="text"
                  value={shape.fill}
                  onChange={handleFillChange}
                  onBlur={handleFillBlur} // Added
                  className="h-8 flex-1"
                  placeholder="#000000 nebo transparent"
                />
              </div>
            </div>

            {/* Obrys */}
            {shape.shapeType !== "line" && (
              <div className="space-y-1">
                <Label htmlFor="shape-stroke" className="text-xs">
                  {isArrow ? "Barva čáry" : "Barva obrysu"}
                </Label>
                <div className="flex gap-2">
                  <input
                    id="stroke-color"
                    type="color"
                    value={shape.stroke}
                    onChange={handleStrokeChange}
                    onBlur={handleStrokeBlur} // Added
                    className="h-8 w-8 cursor-pointer rounded border"
                  />
                  <Input
                    id="shape-stroke"
                    type="text"
                    value={shape.stroke}
                    onChange={handleStrokeChange}
                    onBlur={handleStrokeBlur} // Added
                    className="h-8 flex-1"
                    placeholder="#000000"
                  />
                </div>
              </div>
            )}

            {/* Tloušťka obrysu */}
            {shape.shapeType !== "line" && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="shape-stroke-width" className="text-xs">
                    {isArrow ? "Tloušťka čáry" : "Tloušťka obrysu"}
                  </Label>
                  <span className="text-xs">{shape.strokeWidth} px</span>
                </div>
                <Slider
                  value={[shape.strokeWidth]}
                  min={0}
                  max={30}
                  step={1}
                  onValueChange={handleStrokeWidthChange}
                  onValueCommit={handleStrokeWidthCommit} // Added
                />
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
