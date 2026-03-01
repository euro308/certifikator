import JSZip from "jszip";

/**
 * Helper pro stažení Data URL nebo běžné URL jako souboru v prohlížeči.
 */
export function downloadFile(url: string, filename: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/**
 * Zabalí pole certifikátů do ZIP souboru a automaticky stáhne.
 * @param certificates Pole objektů obsahující jméno příjemce a data URL certifikátu.
 * @param zipFilename Název výsledného ZIP souboru (např. "certifikaty.zip")
 */
export async function downloadCertificatesAsZip(
    certificates: { recipientName: string; certificateUrl: string }[],
    zipFilename = "certifikaty.zip"
) {
    const zip = new JSZip();

    // Vytvoříme bezpečnější názvy souborů k zamezení kolizím
    const nameCounts: Record<string, number> = {};

    for (const cert of certificates) {
        if (!cert.certificateUrl || cert.certificateUrl === "pending") continue;

        // Data z data:image/png;base64,...
        const base64Data = cert.certificateUrl.split(",")[1];
        if (!base64Data) continue;

        const safeName = cert.recipientName
            .trim()
            .replace(/[^a-zA-Z0-9ěščřžýáíéůúťďňĚŠČŘŽÝÁÍÉŮÚŤĎŇ]+/g, "_")
            .toLowerCase() || "certifikat";

        // Ošetření duplicit
        let filename = `${safeName}.png`;
        if (nameCounts[safeName] !== undefined) {
            nameCounts[safeName]++;
            filename = `${safeName}_${nameCounts[safeName]}.png`;
        } else {
            nameCounts[safeName] = 1;
        }

        zip.file(filename, base64Data, { base64: true });
    }

    const blob = await zip.generateAsync({ type: "blob" });

    // Vytvoření dočasné URL pro stažení
    const url = URL.createObjectURL(blob);
    downloadFile(url, zipFilename);
    URL.revokeObjectURL(url);
}
