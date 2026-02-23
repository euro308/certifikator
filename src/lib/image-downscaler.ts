export async function downscaleImage(
    file: File,
    maxMB: number = 2,
    maxWidthOrHeight: number = 800
): Promise<string> {
    return new Promise((resolve, reject) => {
        // Check if the file is an image
        if (!file.type.startsWith("image/")) {
            return reject(new Error("File is not an image."));
        }

        const maxBytes = maxMB * 1024 * 1024;
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;

                // Calculate proportional downscale if limits are exceeded
                if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
                    const ratio = Math.min(maxWidthOrHeight / width, maxWidthOrHeight / height);
                    width = width * ratio;
                    height = height * ratio;
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    return reject(new Error("Failed to get canvas context."));
                }

                // Draw image downscaled
                ctx.drawImage(img, 0, 0, width, height);

                // Attempt export with iterative quality reduction if needed
                let quality = 0.9;
                let dataUrl = canvas.toDataURL("image/webp", quality);

                // Calculate approximate byte size of base64
                const getByteSize = (base64String: string) => {
                    const base64Str = base64String.split(",")[1];
                    if (!base64Str) return 0;
                    return (base64Str.length * 3) / 4 - 2; // Rough estimate of padding overhead
                };

                // Try to lower quality until size fits
                while (getByteSize(dataUrl) > maxBytes && quality > 0.1) {
                    quality -= 0.1;
                    dataUrl = canvas.toDataURL("image/webp", quality);
                }

                if (getByteSize(dataUrl) > maxBytes) {
                    return reject(new Error(`Obrázek se nepodařilo zmenšit pod limit ${maxMB} MB. Zkuste prosím vybrat menší fotku.`));
                }

                resolve(dataUrl);
            };

            img.onerror = () => reject(new Error("Failed to load image."));
            if (event.target?.result && typeof event.target.result === "string") {
                img.src = event.target.result;
            }
        };

        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsDataURL(file);
    });
}
