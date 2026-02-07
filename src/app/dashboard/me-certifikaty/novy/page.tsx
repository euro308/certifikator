"use client";

import React, { useState, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  FileSpreadsheet,
  ArrowRight,
  Upload,
  CheckCircle2,
  FileText,
  Users,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type GenerationMode = "bulk" | "single";

export default function NovyCertifikatPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<GenerationMode>("bulk");

  // State pro Hromadné generování (Excel)
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelData, setExcelData] = useState<unknown[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State pro Jednotlivý certifikát
  const [singleData, setSingleData] = useState<Record<string, string>>({});

  // Načtení uživatelových šablon
  const { data: templates, isLoading: templatesLoading } =
    api.templates.getUserTemplates.useQuery();

  // Najít vybranou šablonu
  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);
  // Placeholdery šablony (přetypování, protože v DB je to jsonb)
  const placeholders = (selectedTemplate?.placeholders as string[]) || [];

  const handleTemplateSelect = (value: string) => {
    setSelectedTemplateId(value);
    // Reset stavů při změně šablony
    setMapping({});
    setSingleData({});
    setStep(1); // Zůstat na kroku 1, ale povolit přechod
  };

  const correctPlaceholderText = () => {
    if (placeholders.length == 1) {
      return "1 proměnná";
    } else if (placeholders.length > 1 && placeholders.length <= 4) {
      return `${placeholders.length} proměnné`;
    } else {
      return `${placeholders.length} proměnných`;
    }
  };

  const correctGenerateCertificatesText = () => {
    if (excelData.length == 1) {
      return "Generovat certifikát";
    } else if (excelData.length > 1 && excelData.length <= 4) {
      return `Generovat ${excelData.length} certifikáty`;
    } else {
      return `Generovat ${excelData.length} certifikátů`;
    }
  };

  const sendCorrectSuccessToast = (data: unknown[]) => {
    if (data.length == 1) {
      toast.success(`Načten ${data.length} záznam`);
    } else if (data.length > 1 && data.length <= 4) {
      toast.success(`Načteny ${data.length} záznamy`);
    } else {
      toast.success(`Načteno ${data.length} záznamů`);
    }
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
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Načtení dat jako JSON
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          toast.error("Soubor je prázdný");
          return;
        }

        // Získání hlaviček z prvního řádku dat
        const headers = Object.keys(data[0] as object);

        setExcelHeaders(headers);
        setExcelData(data);

        // Inteligentní automapping (pokud se názvy shodují)
        const newMapping: Record<string, string> = {};
        placeholders.forEach((p) => {
          // Zkus najít přesnou shodu nebo shodu bez diakritiky/case-insensitive
          const match = headers.find(
            (h) =>
              h.toLowerCase() === p.toLowerCase() ||
              h.toLowerCase().includes(p.toLowerCase()),
          );
          if (match) {
            newMapping[p] = match;
          }
        });
        setMapping(newMapping);

        sendCorrectSuccessToast(data);
      } catch (err) {
        console.error(err);
        toast.error(
          "Chyba při čtení souboru. Ujistěte se, že jde o validní Excel.",
        );
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleSingleInputChange = (key: string, value: string) => {
    setSingleData((prev) => ({ ...prev, [key]: value }));
  };

  const handleMappingChange = (placeholder: string, column: string) => {
    setMapping((prev) => ({ ...prev, [placeholder]: column }));
  };

  // Validace, zda je vše připraveno ke generování
  const isBulkReady =
    excelData.length > 0 && placeholders.every((p) => mapping[p]); // Všechny placeholdery musí být namapované

  const isSingleReady = placeholders.every(
    (p) => singleData[p] && singleData[p].trim() !== "",
  );

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Vytvořit nové certifikáty
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Vyberte šablonu a zadejte data pro vygenerování certifikátů.
        </p>
      </div>

      {/* KROK 1: Výběr šablony */}
      <Card className={step === 1 ? "border-primary/50 shadow-md" : ""}>
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
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Moje šablony
              </label>
              <Select
                value={selectedTemplateId}
                onValueChange={handleTemplateSelect}
                disabled={templatesLoading || step !== 1}
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
                <SelectContent>
                  {templatesLoading ? (
                    <div className="text-muted-foreground flex items-center justify-center p-4">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Načítám šablony...
                    </div>
                  ) : templates?.length === 0 ? (
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
                    templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {step === 1 && (
              <Button
                disabled={!selectedTemplateId}
                onClick={() => setStep(2)}
                className="w-full sm:w-auto"
              >
                Pokračovat <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          {selectedTemplate && (
            <div className="bg-muted/50 mt-4 rounded-lg border p-4">
              <div className="flex gap-4">
                {selectedTemplate.previewImageUrl ? (
                  <div className="relative aspect-[1.414] w-32 shrink-0 overflow-hidden rounded-md border bg-white shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedTemplate.previewImageUrl}
                      alt={selectedTemplate.name}
                      className="h-full w-full object-cover"
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
                      {correctPlaceholderText()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KROK 2: Zadání dat */}
      <div
        className={
          step === 2 ? "block" : "pointer-events-none hidden opacity-50"
        }
      >
        <Tabs
          defaultValue="bulk"
          value={mode}
          onValueChange={(v) => setMode(v as GenerationMode)}
          className="w-full"
        >
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Hromadné generování (Excel)
            </TabsTrigger>
            <TabsTrigger value="single" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Jeden certifikát
            </TabsTrigger>
          </TabsList>

          <Card className="border-primary/50 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm">
                  2
                </span>
                {mode === "bulk" ? "Nahrání dat a mapování" : "Vyplnění údajů"}
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
                    // Kliknutí funguje jen když není soubor nahrán (aby šlo kliknout na tlačítko Smazat)
                    if (!excelFile) {
                      fileInputRef.current?.click();
                    }
                  }}
                  className={`relative flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-10 text-center transition-colors ${!excelFile ? "hover:border-primary/50 cursor-pointer hover:bg-gray-50" : "bg-white"} `}
                >
                  {/* Skrytý Input */}
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
                        <CheckCircle2 className="h-5 w-5" />
                        {excelFile.name}
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Počet načtených řádků: {excelData.length}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
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
                        <Upload className="text-primary h-6 w-6" />
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
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-lg font-semibold">
                      Mapování proměnných
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Přiřaďte sloupce z Excelu k proměnným v šabloně.
                    </p>

                    <div className="max-w-3xl space-y-3">
                      {placeholders.length === 0 ? (
                        <p className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-600">
                          Tato šablona nemá žádné proměnné. Certifikáty budou
                          všechny stejné.
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
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Zpět k výběru
                  </Button>
                  <Button disabled={!isBulkReady} size="lg">
                    {correctGenerateCertificatesText()}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="single" className="mt-0 space-y-6">
                <div className="max-w-3xl space-y-4">
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
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Zpět k výběru
                  </Button>
                  <Button disabled={!isSingleReady} size="lg">
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
