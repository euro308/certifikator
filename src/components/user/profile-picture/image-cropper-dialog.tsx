"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Point, Area } from "react-easy-crop";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";

// Utility to load image
const createImage = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", () => reject(new Error("Failed to load image")));
        image.src = url;
    });

// Generate Cropped Image Base64
async function getCroppedImg(
    imageSrc: string,
    pixelCrop: Area
): Promise<string> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Nepodařilo se vytvořit kontext pro ořez obrázku.");
    }

    // Profilovky chceme většinou kvadratické (512x512 je ideální)
    const destSize = 512;
    canvas.width = destSize;
    canvas.height = destSize;

    // Renderujeme původní obrázek a kopírujeme pouze oříznutou oblast
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        destSize,
        destSize
    );

    return new Promise<string>((resolve, reject) => {
        let quality = 0.9;
        let dataUrl = canvas.toDataURL("image/webp", quality);

        const maxBytes = 2 * 1024 * 1024; // 2 MB
        const getByteSize = (base64String: string) => {
            const base64Str = base64String.split(",")[1];
            if (!base64Str) return 0;
            return (base64Str.length * 3) / 4 - 2;
        };

        while (getByteSize(dataUrl) > maxBytes && quality > 0.1) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL("image/webp", quality);
        }

        if (getByteSize(dataUrl) > maxBytes) {
            return reject(
                new Error(
                    "Nepodařilo se obrázek zmenšit pod 2 MB limit. Vyberte menší oblast nebo jiný obrázek."
                )
            );
        }
        resolve(dataUrl);
    });
}

interface ImageCropperDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    imageSrc: string | null;
    onCropComplete: (base64Image: string) => void;
}

export function ImageCropperDialog({
    isOpen,
    onOpenChange,
    imageSrc,
    onCropComplete,
}: ImageCropperDialogProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropCompleteEvent = useCallback(
        (_croppedArea: Area, croppedAreaPixelsLatest: Area) => {
            setCroppedAreaPixels(croppedAreaPixelsLatest);
        },
        []
    );

    const handleConfirm = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setIsProcessing(true);
        try {
            const croppedBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropComplete(croppedBase64);
            onOpenChange(false);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Chyba při zpracování obrázku."
            );
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Úprava profilové fotografie</DialogTitle>
                    <DialogDescription>
                        Posouvejte obrázkem a nastavte si ideální výřez pro Váš profil.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative mt-4 h-64 w-full overflow-hidden rounded-md bg-stone-100 dark:bg-stone-900 border">
                    {imageSrc ? (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropCompleteEvent}
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            Žádný obrázek není načten.
                        </div>
                    )}
                </div>

                <div className="mt-4 flex items-center gap-4 px-2">
                    <ZoomOut className="h-4 w-4 text-muted-foreground" />
                    <Slider
                        value={[zoom]}
                        min={1}
                        max={3}
                        step={0.1}
                        onValueChange={(vals) => setZoom(vals[0] ?? 1)}
                        disabled={!imageSrc || isProcessing}
                        className="flex-1"
                    />
                    <ZoomIn className="h-4 w-4 text-muted-foreground" />
                </div>

                <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isProcessing}
                    >
                        Zrušit
                    </Button>
                    <Button type="button" onClick={handleConfirm} disabled={isProcessing}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Použít výřez
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
