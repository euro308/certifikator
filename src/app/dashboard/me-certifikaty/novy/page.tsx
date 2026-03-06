"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { api } from "@/trpc/react";
import * as XLSX from "xlsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Save,
  Upload,
  Users,
  Download,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { CanvasElement } from "@/components/editor/types/canvas-types";
import { authClient } from "@/server/better-auth/client";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { EmailSettingsForm } from "@/components/emails/email-settings-form";
import { LoaderOverlay } from "@/components/shared/loader-overlay";
import { downloadCertificatesAsZip } from "@/lib/download-helper";

// Dynamický import s SSR: false — klíčové pro Konvu
const CertificatePreviewStage = dynamic(
  () =>
    import("@/components/certificate-preview/certificate-preview-stage").then(
      (mod) => mod.CertificatePreviewStage,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] w-full animate-pulse rounded-lg bg-gray-100" />
    ),
  },
);

const CertificateThumbnailGenerator = dynamic(
  () =>
    import("@/components/certificate-preview/certificate-thumbnail-generator").then(
      (mod) => mod.CertificateThumbnailGenerator,
    ),
  {
    ssr: false,
  },
);

type GenerationMode = "bulk" | "single";

interface GeneratedCertificate {
  recipientName: string;
  recipientEmail: string;
  recipientData: Record<string, unknown>;
  canvasData: CanvasElement[];
  templateId: string;
  certificateUrl: string;
  thumbnailImageUrl: string;
}

interface SavedCertificate {
  id: string;
  recipientName: string;
  recipientEmail: string;
  validationToken: string;
  certificateUrl: string;
  thumbnailImageUrl: string;
}

const ITEMS_PER_PAGE = 6; // Mřížka 3×2

const AutoSizedPreview = ({ elements }: { elements: CanvasElement[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setWidth(entry.contentRect.width);
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="flex w-full justify-center">
      {width > 0 ? (
        <CertificatePreviewStage elements={elements} width={width} />
      ) : (
        <div className="h-[200px] w-full animate-pulse rounded-lg bg-gray-100" />
      )}
    </div>
  );
};

function NovyCertifikatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const hasAutoSelected = useRef(false);
  const [mode, setMode] = useState<GenerationMode>("bulk");

  // State pro hromadné generování (Excel)
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelData, setExcelData] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [nameColumn, setNameColumn] = useState<string>("");
  const [emailColumn, setEmailColumn] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State pro jeden certifikát
  const [singleData, setSingleData] = useState<Record<string, string>>({});
  const [singleName, setSingleName] = useState<string>("");
  const [singleEmail, setSingleEmail] = useState<string>("");

  // Generovaná data a stránkování
  const [generatedCertificates, setGeneratedCertificates] = useState<
    GeneratedCertificate[]
  >([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(),
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Stav generování obrázků
  const [generationIndex, setGenerationIndex] = useState(0);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);

  // Stav pro krok 4 (odesílání e-mailů)
  const { data: session } = authClient.useSession();
  const [savedCertificates, setSavedCertificates] = useState<
    SavedCertificate[]
  >([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(
    new Set(),
  );
  const [senderName, setSenderName] = useState("");
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const hasInitializedSenderName = useRef(false);

  // Načtení uživatelových šablon
  const { data: templatesData, isLoading: templatesLoading } =
    api.templates.getUserTemplates.useQuery();

  // Spojený seznam pro dropdown výběr šablony
  const templates = React.useMemo(() => {
    if (!templatesData) return undefined;
    const own = templatesData.ownTemplates ?? [];
    const favs = (templatesData.favTemplates ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      thumbnailImageUrl: f.thumbnailImageUrl,
      placeholders: f.placeholders,
      createdAt: f.favoritedAt,
    }));
    return [...own, ...favs] as typeof own;
  }, [templatesData]);

  // Podpora cizí šablony z galerie (z URL parametru)
  const galleryTemplateId = searchParams.get("idSablony") ?? undefined;
  const isGalleryId =
    !!galleryTemplateId &&
    !templatesLoading &&
    templates !== undefined &&
    !templates.some((t) => t.id === galleryTemplateId);

  const { data: galleryTemplate } = api.templates.getTemplatePublic.useQuery(
    { templateId: galleryTemplateId! },
    { enabled: isGalleryId },
  );

  // Nastavení výchozího jména odesílatele (pouze jednou)
  useEffect(() => {
    if (session?.user?.name && !hasInitializedSenderName.current) {
      setSenderName(session.user.name);
      hasInitializedSenderName.current = true;
    }
  }, [session?.user?.name]);

  // Auto-výběr šablony z URL parametru ?idSablony=xxx
  useEffect(() => {
    if (hasAutoSelected.current || templatesLoading || !templates) return;

    const idSablony = searchParams.get("idSablony");
    if (!idSablony) return;

    // Nejprve zkusíme vlastní šablony
    const matchedTemplate = templates.find((t) => t.id === idSablony);
    if (matchedTemplate) {
      setSelectedTemplateId(matchedTemplate.id);
      setStep(2);
      hasAutoSelected.current = true;
      toast.success("Šablona byla úspěšně načtena.");
      return;
    }

    // Pokud není vlastní, použijeme galerijní
    if (galleryTemplate) {
      setSelectedTemplateId(galleryTemplate.id);
      setStep(2);
      hasAutoSelected.current = true;
      toast.success(`Šablona "${galleryTemplate.name}" načtena z galerie.`);
    }
  }, [searchParams, templates, templatesLoading, galleryTemplate]);

  // Logika stránkování
  const totalPages = Math.ceil(generatedCertificates.length / ITEMS_PER_PAGE);
  const displayedCertificates = generatedCertificates.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const correctPlaceholderText = (number: number) => {
    if (number === 1) return "1 proměnná";
    if (number > 1 && number <= 4) return `${number} proměnné`;
    return `${number} proměnných`;
  };

  const correctCertificatesText = (number: number) => {
    if (number == 1) return "certifikát";
    if (number > 1 && number <= 4) return `${number} certifikáty`;
    return `${number} certifikátů`;
  };

  const correctSuccessToastText = (number: number) => {
    if (number == 1) return "vytvořen 1 certifikát.";
    if (number > 1 && number <= 4) return `vytvořeny ${number} certifikáty`;
    return `vytvořeno ${number} certifikátů`;
  };

  // Reset stránky při nové generaci
  useEffect(() => {
    setCurrentPage(1);
  }, [generatedCertificates]);

  // Reset generace při novém kroku
  useEffect(() => {
    if (step === 3 && generatedCertificates.length > 0) {
      setGenerationIndex(0);
      setIsGeneratingImages(true);
    } else {
      setIsGeneratingImages(false);
    }
  }, [step, generatedCertificates.length]);

  // tRPC mutace pro odesílání e-mailů
  const sendEmailsMutation = api.emails.sendCertificatesBatch.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Úspěšně odesláno ${data.sentCount} z ${data.total} e-mailů.`,
      );
      router.push("/dashboard/me-certifikaty");
    },
    onError: (err) => {
      toast.error("Chyba při odesílání e-mailů: " + err.message);
      setIsSendingEmails(false);
    },
  });

  const createBatch = api.certificates.createBatch.useMutation({
    onSuccess: (data: unknown[]) => {
      const certificates = data as SavedCertificate[];
      toast.success(`Úspěšně ${correctSuccessToastText(certificates.length)}`);

      setSavedCertificates(certificates);
      const validEmails = certificates.map((c) => c.id);
      setSelectedRecipients(new Set(validEmails));

      setStep(4);
      setIsSaving(false);
    },
    onError: (err: { message: string }) => {
      toast.error("Chyba při ukládání certifikátů: " + err.message);
      setIsSaving(false);
    },
  });

  // Nalezení vybrané šablony
  const selectedTemplateRaw =
    templates?.find((t) => t.id === selectedTemplateId) ??
    (galleryTemplate?.id === selectedTemplateId ? galleryTemplate : undefined);

  // Zkopírujeme strukturu, aby se dodržel TS u placeholders (které jsou unknown z DB — přecastujeme)
  const selectedTemplate = selectedTemplateRaw
    ? {
        ...selectedTemplateRaw,
        placeholders: selectedTemplateRaw.placeholders as string[] | null,
      }
    : undefined;

  // Placeholdery šablony (používají se v UI kroku 2)
  const placeholders = selectedTemplate?.placeholders ?? [];

  const handleTemplateSelect = (value: string) => {
    setSelectedTemplateId(value);
    setMapping({});
    setSingleData({});
    setStep(1);
    setGeneratedCertificates([]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    const reader = new FileReader();

    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (!bstr) return;

      try {
        const wb = XLSX.read(bstr, { type: "array" });
        const wsname = wb.SheetNames[0];
        if (!wsname) {
          toast.error("Soubor neobsahuje žádné listy");
          return;
        }
        const ws = wb.Sheets[wsname];
        if (!ws) return;
        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

        if (data.length === 0) {
          toast.error("Soubor je prázdný");
          return;
        }

        const headers = Object.keys(data[0] as object);
        setExcelHeaders(headers);
        setExcelData(data);

        // Automatické mapování placeholderů
        const newMapping: Record<string, string> = {};
        placeholders.forEach((p) => {
          const match = headers.find(
            (h) =>
              h.toLowerCase() === p.toLowerCase() ||
              h.toLowerCase().includes(p.toLowerCase()),
          );
          if (match) newMapping[p] = match;
        });
        setMapping(newMapping);

        // Automatické mapování systémových informací (pro DB)
        const nameMatch = headers.find(
          (h) =>
            h.toLowerCase().includes("jméno") ||
            h.toLowerCase().includes("name"),
        );
        if (nameMatch) setNameColumn(nameMatch);

        const emailMatch = headers.find(
          (h) =>
            h.toLowerCase().includes("email") ||
            h.toLowerCase().includes("e-mail"),
        );
        if (emailMatch) setEmailColumn(emailMatch);

        if (data.length == 1) toast.success(`Načten ${data.length} záznam`);
        else if (data.length > 1 && data.length <= 4)
          toast.success(`Načteny ${data.length} záznamy`);
        else toast.success(`Načteno ${data.length} záznamů`);
      } catch (err) {
        console.error(err);
        toast.error(
          "Chyba při čtení souboru. Ujistěte se, že jde o validní Excel.",
        );
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSingleInputChange = (key: string, value: string) => {
    setSingleData((prev) => ({ ...prev, [key]: value }));
  };

  const handleMappingChange = (placeholder: string, column: string) => {
    setMapping((prev) => ({ ...prev, [placeholder]: column }));
  };

  // Validace připravenosti
  const isBulkReady =
    excelData.length > 0 && placeholders.every((p) => mapping[p]);
  const isSingleReady =
    placeholders.every((p) => singleData[p] && singleData[p].trim() !== "") &&
    singleName.trim() !== "";

  const utils = api.useUtils();
  const [isGenerating, setIsGenerating] = useState(false);

  // Generování certifikátů
  const generateCertificates = async () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);

    let rawCanvasData: unknown;

    // Získání plných dat šablony, pokud je to potřeba
    if ("canvasData" in selectedTemplate && selectedTemplate.canvasData) {
      rawCanvasData = selectedTemplate.canvasData;
    } else {
      try {
        const fullTemplate = await utils.templates.getTemplateById.fetch({
          templateId: selectedTemplate.id,
        });
        if (!fullTemplate?.canvasData) {
          toast.error("Nepodařilo se načíst plná data šablony.");
          setIsGenerating(false);
          return;
        }
        rawCanvasData = fullTemplate.canvasData;
      } catch {
        toast.error("Chyba při stahování dat šablony ze serveru.");
        setIsGenerating(false);
        return;
      }
    }

    // Získání elementů
    let templateElements: CanvasElement[] = [];

    if (Array.isArray(rawCanvasData)) {
      templateElements = rawCanvasData as CanvasElement[];
    } else if (
      typeof rawCanvasData === "object" &&
      rawCanvasData !== null &&
      "elements" in rawCanvasData
    ) {
      templateElements = (rawCanvasData as { elements: CanvasElement[] })
        .elements;
    } else {
      console.error("Neplatný formát dat šablony:", rawCanvasData);
      toast.error("Chyba dat šablony: Nepodařilo se načíst prvky.");
      setIsGenerating(false);
      return;
    }

    const newCertificates: GeneratedCertificate[] = [];

    if (mode === "bulk") {
      excelData.forEach((row) => {
        // Deep clone elementů
        const elementsCopy = JSON.parse(
          JSON.stringify(templateElements),
        ) as CanvasElement[];

        // Nahrazení placeholderů
        elementsCopy.forEach((el) => {
          if (el.type === "placeholder") {
            const pKey = el.placeholderKey.replace(/^{{|}}$/g, "").trim();
            const colName = mapping[pKey];

            if (colName && row[colName] !== undefined) {
              const val = row[colName];

              el.displayText =
                typeof val === "string" || typeof val === "number"
                  ? String(val)
                  : "";
            }
          } else if (el.type === "text") {
            let newText = el.text;
            const matches = [...newText.matchAll(/\{\{([^}]+)}}/g)];
            matches.forEach((match) => {
              const pKey = match[1]?.trim();
              if (!pKey) return;
              const colName = mapping[pKey];
              if (colName && row[colName] !== undefined) {
                const val = row[colName];
                newText = newText.replace(
                  match[0],
                  typeof val === "string" || typeof val === "number"
                    ? String(val)
                    : "",
                );
              }
            });
            el.text = newText;
          }
        });

        const rName = nameColumn ? row[nameColumn] : undefined;
        const rEmail = emailColumn ? row[emailColumn] : undefined;

        newCertificates.push({
          recipientName:
            typeof rName === "string" || typeof rName === "number"
              ? String(rName)
              : "Neznámý příjemce",
          recipientEmail:
            typeof rEmail === "string" || typeof rEmail === "number"
              ? String(rEmail)
              : "",
          recipientData: row,
          canvasData: elementsCopy,
          templateId: selectedTemplate.id,
          certificateUrl: "pending",
          thumbnailImageUrl: "pending",
        });
      });
    } else {
      // Pro jeden certifikát
      const elementsCopy = JSON.parse(
        JSON.stringify(templateElements),
      ) as CanvasElement[];
      elementsCopy.forEach((el) => {
        if (el.type === "placeholder") {
          const pKey = el.placeholderKey.replace(/^{{|}}$/g, "").trim();
          const val = singleData[pKey];
          if (val) {
            el.displayText = val;
          }
        } else if (el.type === "text") {
          let newText = el.text;
          const matches = [...newText.matchAll(/\{\{([^}]+)}}/g)];
          matches.forEach((match) => {
            const pKey = match[1]?.trim();
            if (!pKey) return;
            const val = singleData[pKey];
            if (val) {
              newText = newText.replace(match[0], String(val));
            }
          });
          el.text = newText;
        }
      });

      newCertificates.push({
        recipientName: singleName,
        recipientEmail: singleEmail,
        recipientData: singleData,
        canvasData: elementsCopy,
        templateId: selectedTemplate.id,
        certificateUrl: "pending",
        thumbnailImageUrl: "pending",
      });
    }

    setGeneratedCertificates(newCertificates);
    setSelectedIndices(new Set(newCertificates.map((_, i) => i)));
    setStep(3);
    setIsGenerating(false);
  };

  const handleThumbnailGenerated = (data: {
    certificateUrl: string;
    thumbnailImageUrl: string;
  }) => {
    setGeneratedCertificates((prev) => {
      const newCerts = [...prev];
      if (newCerts[generationIndex]) {
        newCerts[generationIndex].certificateUrl =
          data.certificateUrl || "pending";
        newCerts[generationIndex].thumbnailImageUrl =
          data.thumbnailImageUrl || "pending";
      }
      return newCerts;
    });

    if (generationIndex < generatedCertificates.length - 1) {
      setGenerationIndex((prev) => prev + 1);
    } else {
      setIsGeneratingImages(false);
    }
  };

  const setItemSelected = (index: number, selected: boolean) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(index);
      } else {
        next.delete(index);
      }
      return next;
    });
  };

  const setAllSelected = (selected: boolean) => {
    if (selected) {
      setSelectedIndices(new Set(generatedCertificates.map((_, i) => i)));
    } else {
      setSelectedIndices(new Set());
    }
  };

  const handleSave = () => {
    const selectedCerts = generatedCertificates.filter((_, i) =>
      selectedIndices.has(i),
    );

    if (selectedCerts.length === 0) {
      toast.error("Musíte vybrat alespoň jeden certifikát k uložení.");
      return;
    }

    const pendingSelected = selectedCerts.filter(
      (c) =>
        c.certificateUrl === "pending" || c.thumbnailImageUrl === "pending",
    );
    if (pendingSelected.length > 0) {
      toast.warning(
        `Některé vybrané certifikáty ještě nemají vygenerovaný náhled. Počkejte prosím na dokončení.`,
      );
      return;
    }

    setIsSaving(true);
    createBatch.mutate(
      selectedCerts.map((cert) => ({
        templateId: cert.templateId,
        recipientName: cert.recipientName,
        recipientEmail: cert.recipientEmail,
        recipientData: cert.recipientData,
        certificateUrl: cert.certificateUrl,
        thumbnailImageUrl: cert.thumbnailImageUrl,
      })),
    );
  };

  const handleSendEmails = () => {
    const recipientsToSend = savedCertificates.filter(
      (c) => selectedRecipients.has(c.id) && !!c.recipientEmail,
    );

    if (recipientsToSend.length === 0) {
      toast.error("Vyberte alespoň jednoho příjemce se zadaným e-mailem.");
      return;
    }

    if (!senderName.trim()) {
      toast.error("Zadejte jméno odesílatele.");
      return;
    }

    setIsSendingEmails(true);
    sendEmailsMutation.mutate({
      recipients: recipientsToSend.map((c) => ({
        email: c.recipientEmail,
        name: c.recipientName,
        validationToken: c.validationToken,
        certificateUrl: c.certificateUrl,
      })),
      senderName: senderName,
    });
  };

  const toggleRecipient = (id: string, checked: boolean) => {
    setSelectedRecipients((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAllRecipients = (checked: boolean) => {
    if (checked) {
      const allIds = savedCertificates.map((c) => c.id);
      setSelectedRecipients(new Set(allIds));
    } else {
      setSelectedRecipients(new Set());
    }
  };

  // Render

  // Layout pro krok 3 (kontrola certifikátů)
  if (step === 3) {
    return (
      <div className="container mx-auto max-w-[1400px] space-y-6 px-4 py-8">
        {/* Skrytý generátor */}
        {isGeneratingImages && generatedCertificates[generationIndex] && (
          <CertificateThumbnailGenerator
            key={generationIndex}
            elements={generatedCertificates[generationIndex].canvasData}
            onGenerate={handleThumbnailGenerated}
          />
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {generatedCertificates.length === 1
                ? "Náhled certifikátu"
                : "Náhled certifikátů"}
            </h1>
            <p className="text-muted-foreground">
              Vybráno {selectedIndices.size} z {generatedCertificates.length}{" "}
              {generatedCertificates.length > 1 ? "certifikátů" : "certifikátu"}
              .
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 shadow-sm">
              <Checkbox
                id="select-all"
                checked={
                  selectedIndices.size === generatedCertificates.length &&
                  generatedCertificates.length > 0
                }
                onCheckedChange={(v) => setAllSelected(!!v)}
              />
              <Label htmlFor="select-all" className="cursor-pointer text-sm">
                Vybrat vše
              </Label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Zpět na úpravu dat
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || selectedIndices.size === 0}
                className="min-w-[160px]"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                Uložit vybrané ({selectedIndices.size})
              </Button>
            </div>
          </div>
        </div>

        {/* Grid certifikátů */}
        <div
          className={`grid gap-6 ${
            displayedCertificates.length === 1
              ? "mx-auto max-w-3xl grid-cols-1"
              : displayedCertificates.length === 2
                ? "mx-auto max-w-6xl grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {displayedCertificates.map((cert, i) => {
            const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + i;
            const isSelected = selectedIndices.has(globalIndex);

            return (
              <div
                key={i}
                className={`flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md ${!isSelected ? "opacity-60 grayscale-[0.5]" : ""}`}
              >
                <div className="flex items-center gap-3 border-b bg-gray-50/50 p-3">
                  <Checkbox
                    id={`cert-${globalIndex}`}
                    checked={isSelected}
                    onCheckedChange={(v) => setItemSelected(globalIndex, !!v)}
                  />
                  <div
                    className="min-w-0 flex-1 cursor-pointer"
                    onClick={() => setItemSelected(globalIndex, !isSelected)}
                  >
                    {" "}
                    <h3
                      className="truncate text-sm font-semibold"
                      title={cert.recipientName}
                    >
                      {cert.recipientName}
                    </h3>
                    <p
                      className="text-muted-foreground truncate text-xs"
                      title={cert.recipientEmail}
                    >
                      {cert.recipientEmail || "Bez emailu"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 items-center justify-center bg-white p-2">
                  {/* Preview Stage - AutoSized */}
                  <AutoSizedPreview elements={cert.canvasData} />
                </div>
              </div>
            );
          })}
        </div>
        {/* Ovládání stránkování */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-4 py-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-medium">
              Strana {currentPage} z {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Layout pro krok 4 (posílání e-mailů)
  if (step === 4) {
    return (
      <div className="container mx-auto max-w-[1400px] space-y-6 px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Odeslání e-mailů
            </h1>
            <p className="text-muted-foreground">
              Certifikáty byly úspěšně vytvořeny. Nyní je můžete odeslat
              příjemcům.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/me-certifikaty")}
            >
              Přeskočit a přejít do přehledu
            </Button>
            <Button
              onClick={async () => {
                const recipientsToDownload = savedCertificates.filter((c) =>
                  selectedRecipients.has(c.id),
                );
                if (recipientsToDownload.length === 0) {
                  toast.error("Vyberte alespoň jednoho příjemce pro stažení.");
                  return;
                }
                try {
                  toast.loading("Připravuji ZIP archiv ke stažení...", {
                    id: "zip-download",
                  });
                  await downloadCertificatesAsZip(
                    recipientsToDownload,
                    "certifikaty.zip",
                  );
                  toast.success("Stažení úspěšně zahájeno", {
                    id: "zip-download",
                  });
                } catch {
                  toast.error("Nastala chyba při vytváření ZIP archivu", {
                    id: "zip-download",
                  });
                }
              }}
              className="bg-[#E65758] text-white hover:bg-[#d44647]"
              disabled={selectedRecipients.size === 0}
            >
              <Download className="mr-2 size-4" />
              Stáhnout {selectedRecipients.size} jako ZIP
            </Button>
            <Button
              onClick={handleSendEmails}
              disabled={isSendingEmails || selectedRecipients.size === 0}
              className="min-w-[160px]"
            >
              {isSendingEmails ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Users className="mr-2 size-4" />
              )}
              Odeslat e-mailem
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Levný sloupec: Seznam příjemců */}
          <Card className="flex h-[95vh] flex-col">
            <CardHeader className="shrink-0">
              <CardTitle className="flex items-center justify-between">
                <span>Příjemci</span>
                <div className="flex items-center gap-2 text-sm font-normal">
                  <Checkbox
                    id="select-all-emails"
                    checked={
                      selectedRecipients.size === savedCertificates.length &&
                      savedCertificates.length > 0
                    }
                    onCheckedChange={(v) => toggleAllRecipients(!!v)}
                  />
                  <Label
                    htmlFor="select-all-emails"
                    className="cursor-pointer font-normal"
                  >
                    Vybrat vše
                  </Label>
                </div>
              </CardTitle>
              <CardDescription>
                Vyberte příjemce k další akci (odeslání e-mailu nebo stažení
                PDF/ZIP).
              </CardDescription>
            </CardHeader>
            {/* Tady je kouzlo flex-1 a min-h-0, které vyplní zbylý prostor a dovolí scroll */}
            <CardContent className="min-h-0 flex-1 overflow-y-auto pr-4">
              <div className="flex flex-col gap-2">
                {savedCertificates.map((cert) => {
                  const hasEmail = !!cert.recipientEmail;
                  const isSelected = selectedRecipients.has(cert.id);

                  return (
                    <div
                      key={cert.id}
                      className={`flex items-center gap-3 rounded-md border p-3 transition-colors ${
                        isSelected
                          ? "bg-primary/5 border-primary/20"
                          : "bg-white"
                      }`}
                    >
                      <Checkbox
                        id={`action-recipient-${cert.id}`}
                        checked={isSelected}
                        onCheckedChange={(v) => toggleRecipient(cert.id, !!v)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">
                          {cert.recipientName}
                        </div>
                        <div className="text-muted-foreground truncate text-sm">
                          {hasEmail
                            ? cert.recipientEmail
                            : "E-mail nevyplněn (nelze odeslat mailem)"}
                        </div>
                      </div>
                      <div className="text-muted-foreground shrink-0 truncate font-mono text-xs">
                        {cert.id}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Pravý sloupec: Editor e-mailu */}
          <Card className="flex h-[95vh] flex-col">
            <CardHeader className="shrink-0">
              <CardTitle>Nastavení odesílatele</CardTitle>
              <CardDescription>
                Upravte, jak se budete příjemcům zobrazovat.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col space-y-4">
              <EmailSettingsForm
                senderName={senderName}
                onSenderNameChange={setSenderName}
                className="flex flex-1 flex-col px-0.5"
              />

              {/* Tip na konci - smrskne se jen na svou výšku */}
              <div className="shrink-0 rounded-md bg-blue-50 p-4 text-sm text-blue-700">
                <p>
                  <strong>Tip:</strong> Certifikát bude automaticky přiložen
                  jako příloha k e-mailu.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Layout pro Krok 1 a 2
  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Vytvořit nové certifikáty
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Krok {step} z 3: {step === 1 ? "Výběr šablony" : "Zadání dat"}
        </p>
      </div>

      {/* KROK 1: Výběr šablony */}
      <Card className={step === 1 ? "border-primary/50 shadow-md" : "hidden"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm">
              1
            </span>
            Výběr šablony
          </CardTitle>
          <CardDescription>
            Zvolte šablonu, kterou chcete použít.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Moje šablony
              </label>
              <Select
                value={selectedTemplateId}
                onValueChange={handleTemplateSelect}
                disabled={templatesLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      templatesLoading
                        ? "Načítám šablony..."
                        : "Vyberte šablonu..."
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {templatesLoading ? (
                    <div className="text-muted-foreground flex items-center justify-center p-4">
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Načítám šablony...
                    </div>
                  ) : templates?.length === 0 &&
                    (templatesData?.favTemplates?.length ?? 0) === 0 &&
                    !galleryTemplate ? (
                    <div className="text-muted-foreground p-2 text-center text-sm">
                      Nemáte žádné šablony.{" "}
                      <Link
                        href="/dashboard/me-sablony/nova"
                        className="text-primary hover:underline"
                      >
                        Vytvořte novou
                      </Link>
                    </div>
                  ) : (
                    <>
                      {/* Šablona z URL jestliže je nová */}
                      {galleryTemplate &&
                        (templatesData?.favTemplates?.length ?? 0) > 0 &&
                        !templatesData?.favTemplates?.some(
                          (f) => f.id === galleryTemplateId,
                        ) && (
                          <>
                            <div className="px-2 py-1.5 text-sm font-semibold text-gray-500">
                              Z galerie
                            </div>
                            <SelectItem
                              key={galleryTemplate.id}
                              value={galleryTemplate.id}
                            >
                              {galleryTemplate.name} (Z galerie –{" "}
                              {galleryTemplate.authorName})
                            </SelectItem>
                          </>
                        )}

                      {/* Vlastní šablony */}
                      {templates && templates.length > 0 && (
                        <>
                          <div className="mx-2 mt-2 border-b py-1.5 text-sm font-semibold text-gray-500">
                            Moje šablony
                          </div>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </>
                      )}

                      {/* Šablony z oblíbených */}
                      {(templatesData?.favTemplates?.length ?? 0) > 0 && (
                        <>
                          <div className="mx-2 mt-2 border-b py-1.5 text-sm font-semibold text-gray-500">
                            Oblíbené šablony z galerie (
                            {templatesData?.favTemplates?.length ?? 0})
                          </div>
                          {templatesData?.favTemplates?.map((template) => (
                            <SelectItem
                              key={template.id}
                              value={template.id}
                              className="py-3"
                            >
                              <div className="flex flex-col gap-1">
                                <span className="leading-none font-medium">
                                  {template.name}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  Od: {template.authorName}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              disabled={!selectedTemplateId}
              onClick={() => setStep(2)}
              className="w-full sm:w-auto"
            >
              Pokračovat <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>

          {selectedTemplate && (
            <div className="bg-muted/50 mt-4 rounded-lg border p-4">
              <div className="flex gap-4">
                {selectedTemplate.thumbnailImageUrl ? (
                  <div className="relative aspect-[1.414] w-32 shrink-0 overflow-hidden rounded-md border bg-white shadow-sm">
                    <Image
                      src={selectedTemplate.thumbnailImageUrl}
                      alt={selectedTemplate.name}
                      className="h-full w-full object-cover"
                      fill
                      sizes="70px"
                    />
                  </div>
                ) : (
                  <div className="text-muted-foreground flex aspect-[1.414] w-32 shrink-0 items-center justify-center rounded-md border bg-white text-xs shadow-sm">
                    Bez náhledu
                  </div>
                )}
                <div>
                  <h4 className="font-semibold">{selectedTemplate.name}</h4>
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {selectedTemplate.description ?? "Bez popisu"}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset">
                      {correctPlaceholderText(placeholders.length)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KROK 2: Zadání dat */}
      <div className={step === 2 ? "block" : "hidden"}>
        <Tabs
          defaultValue="bulk"
          value={mode}
          onValueChange={(v) => setMode(v as GenerationMode)}
          className="w-full"
        >
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Users className="size-4" />
              Hromadné generování (Excel)
            </TabsTrigger>
            <TabsTrigger value="single" className="flex items-center gap-2">
              <FileText className="size-4" />
              Jeden certifikát
            </TabsTrigger>
          </TabsList>

          <Card className="border-primary/50 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm">
                    2
                  </span>
                  {mode === "bulk"
                    ? "Nahrání dat a mapování"
                    : "Vyplnění údajů"}
                </div>
                {mode === "bulk" && (
                  <Link
                    href={"/napoveda/tabulka"}
                    className={
                      "text-muted-foreground text-sm underline hover:text-black"
                    }
                    target={"_blank"}
                    tabIndex={-1}
                  >
                    Jak by měla tabulka vypadat?
                  </Link>
                )}
              </CardTitle>
              <CardDescription>
                {mode === "bulk"
                  ? "Nahrajte tabulku a přiřaďte sloupce k proměnným v šabloně."
                  : "Vyplňte údaje pro jeden konkrétní certifikát."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TabsContent value="bulk" className="mt-0 space-y-6">
                {/* 1. Nahrání souboru */}
                <div
                  onClick={() => {
                    if (!excelFile) {
                      fileInputRef.current?.click();
                    }
                  }}
                  className={`relative flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-10 text-center transition-colors ${!excelFile ? "hover:border-primary/50 cursor-pointer hover:bg-gray-50" : "bg-white"} `}
                >
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {excelFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 font-medium text-green-600">
                        <CheckCircle2 className="size-5" />
                        {excelFile.name}
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Počet načtených řádků: {excelData.length}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExcelFile(null);
                          setExcelData([]);
                          setExcelHeaders([]);
                          setMapping({});
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        className="text-red-500 hover:bg-red-50 hover:text-red-700"
                      >
                        Odstranit soubor
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
                        <Upload className="text-primary size-6" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Klikněte pro nahrání souboru
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Podporované formáty: .xlsx, .xls, .csv
                      </p>
                    </>
                  )}
                </div>

                {/* 2. Mapování sloupců */}
                {excelHeaders.length > 0 && (
                  <div className="space-y-6 border-t pt-4">
                    {/* Systémové sloupce */}
                    <div className="space-y-4 rounded-lg border bg-gray-50/50 p-4">
                      <h3 className="font-semibold text-gray-900">
                        Systémové sloupce (Doporučené)
                      </h3>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Sloupec se Jménem příjemce</Label>
                          <Select
                            value={nameColumn}
                            onValueChange={setNameColumn}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Nevybráno" />
                            </SelectTrigger>
                            <SelectContent>
                              {excelHeaders.map((h) => (
                                <SelectItem key={h} value={h}>
                                  {h}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Sloupec s Emailem</Label>
                          <Select
                            value={emailColumn}
                            onValueChange={setEmailColumn}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Nevybráno" />
                            </SelectTrigger>
                            <SelectContent>
                              {excelHeaders.map((h) => (
                                <SelectItem key={h} value={h}>
                                  {h}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold">
                      Mapování proměnných šablony
                    </h3>

                    <div className="max-w-3xl space-y-3">
                      {placeholders.length === 0 ? (
                        <p className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-600">
                          Tato šablona nemá žádné proměnné.
                        </p>
                      ) : (
                        placeholders.map((placeholder) => (
                          <div
                            key={placeholder}
                            className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[200px_1fr] sm:gap-4"
                          >
                            <Label
                              htmlFor={`mapping-${placeholder}`}
                              className="font-medium sm:text-right"
                            >
                              {placeholder}:
                            </Label>
                            <Select
                              value={mapping[placeholder] ?? ""}
                              onValueChange={(val) =>
                                handleMappingChange(placeholder, val)
                              }
                            >
                              <SelectTrigger
                                id={`mapping-${placeholder}`}
                                className={
                                  mapping[placeholder] ? "border-green-500" : ""
                                }
                              >
                                <SelectValue placeholder="Vyberte sloupec..." />
                              </SelectTrigger>
                              <SelectContent>
                                {excelHeaders.map((header) => (
                                  <SelectItem key={header} value={header}>
                                    {header}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={isGenerating}
                  >
                    Zpět k výběru šablony
                  </Button>
                  <Button
                    disabled={!isBulkReady || isGenerating}
                    size="lg"
                    onClick={generateCertificates}
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : null}
                    Generovat {correctCertificatesText(excelData.length)}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="single" className="mt-0 space-y-6">
                {/* Single systémové inputy */}
                <div className="space-y-4 rounded-lg border bg-gray-50/50 p-4">
                  <h3 className="font-semibold">Systémové údaje</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Jméno příjemce *</Label>
                      <Input
                        value={singleName}
                        onChange={(e) => setSingleName(e.target.value)}
                        placeholder="Jan Novák"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email příjemce</Label>
                      <Input
                        value={singleEmail}
                        onChange={(e) => setSingleEmail(e.target.value)}
                        placeholder="jan@novak.cz"
                      />
                    </div>
                  </div>
                </div>

                <div className="max-w-3xl space-y-4">
                  <h3 className="font-semibold">Proměnné šablony</h3>
                  {placeholders.map((placeholder) => (
                    <div
                      key={placeholder}
                      className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[200px_1fr] sm:gap-4"
                    >
                      <Label
                        htmlFor={`single-${placeholder}`}
                        className="font-medium sm:text-right"
                      >
                        {placeholder}:
                      </Label>
                      <Input
                        id={`single-${placeholder}`}
                        placeholder={`Hodnota pro ${placeholder}`}
                        value={singleData[placeholder] ?? ""}
                        onChange={(e) =>
                          handleSingleInputChange(placeholder, e.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={isGenerating}
                  >
                    Zpět k výběru
                  </Button>
                  <Button
                    disabled={!isSingleReady || isGenerating}
                    size="lg"
                    onClick={generateCertificates}
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : null}
                    Generovat certifikát
                  </Button>
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}

export default function NovyCertifikat() {
  return (
    <Suspense fallback={<LoaderOverlay />}>
      <NovyCertifikatContent />
    </Suspense>
  );
}
