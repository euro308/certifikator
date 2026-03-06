import JSZip from "jszip";

// Helper pro stažení Data URL nebo běžné URL jako souboru v prohlížeči.
export function downloadFile(url: string, filename: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/**
 * Zabalí certifikáty do ZIP souboru a automaticky stáhne.
 * @param certificates
 * @param zipFilename
 */
export async function downloadCertificatesAsZip(
    certificates: { recipientName: string; certificateUrl: string; validationToken: string }[],
    zipFilename = "certifikaty.zip"
) {
    const zip = new JSZip();

    for (const cert of certificates) {
        if (!cert.certificateUrl || cert.certificateUrl === "pending") continue;

        const base64Data = cert.certificateUrl.split(",")[1];
        if (!base64Data) continue;

        const filename = `${cert.validationToken}.png`;
        zip.file(filename, base64Data, { base64: true });
    }

    const blob = await zip.generateAsync({ type: "blob" });

    // Vytvořit dočasnou URL pro stažení
    const url = URL.createObjectURL(blob);
    downloadFile(url, zipFilename);
    URL.revokeObjectURL(url);
}
