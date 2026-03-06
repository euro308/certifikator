export interface DownscaleOptions {
  maxSizeMB?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Zmenší obrázek tak, aby jeho maximální rozměr nepřesáhl maxWidth/maxHeight,
 * a zároveň komprimuje obrázek (WEBP) tak, aby výsledný base64 string zabral méně
 * než maxSizeMB (pokud je definováno).
 */
export async function downscaleImage(
  file: File,
  options: DownscaleOptions = {},
): Promise<{ base64: string; width: number; height: number }> {
  const maxSizeMB = options.maxSizeMB ?? 2; // Defaultní limit 2 MB po kompresi
  const maxWidth = options.maxWidth ?? 3840; // Default maximální šířka 4K
  const maxHeight = options.maxHeight ?? 3840; // Default maximální výška 4K

  const maxBytes = maxSizeMB * 1024 * 1024;

  // 1. Kontrola počáteční velikosti nahrávané fotografie
  if (file.size > 20 * 1024 * 1024) {
    throw new Error(
      "Nahraný soubor přesahuje maximální povolenou velikost 20 MB.",
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Pokud je obrázek větší než max limity, zmenšíme ho při zachování poměru stran
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(
            new Error("Nepodařilo se vytvořit kontext mapy obrázku."),
          );
        }

        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        let dataUrl = canvas.toDataURL("image/webp", quality);

        // Funkce pro výpočet přibližné velikosti Base64 stringu v bajtech
        const getByteSize = (base64String: string) => {
          const base64Str = base64String.split(",")[1];
          if (!base64Str) return 0;
          return (base64Str.length * 3) / 4 - 2;
        };

        // Iterativní snižování kvality, dokud se nevejdeme do limitu (nebo dokud neklesneme moc nízko)
        while (getByteSize(dataUrl) > maxBytes && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/webp", Math.max(0.1, quality));
        }

        if (getByteSize(dataUrl) > maxBytes) {
          return reject(
            new Error(
              `Obrázek je příliš komplexní a nepodařilo se ho zkomprimovat pod ${maxSizeMB} MB. Vyberte jednodušší obrázek, nebo ho před nahráním ořízněte.`,
            ),
          );
        }

        resolve({ base64: dataUrl, width, height });
      };

      img.onerror = () => {
        reject(new Error("Nepodařilo se načíst obrázek pro zmenšování."));
      };

      img.src = imgUrl;
    };

    reader.onerror = () => {
      reject(new Error("Nepodařilo se přečíst soubor."));
    };

    reader.readAsDataURL(file);
  });
}
