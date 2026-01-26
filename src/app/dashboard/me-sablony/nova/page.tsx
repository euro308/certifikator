"use client";

import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import { EditorDialog } from "@/components/editor/editor-dialog";
import Link from "next/link";
import { useTemplateDraft } from "@/components/editor/hooks/use-template-draft";
import type { TemplateExportData } from "@/components/editor/types/canvas-types";
import { useRouter } from "next/navigation";

export default function NovaSablona() {
  const router = useRouter();
  const { saveDraft, loadDraft, clearDraft, hasDraft } = useTemplateDraft();

  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [canvasData, setCanvasData] = useState<TemplateExportData | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const mutation = api.templates.createTemplate.useMutation();

  // ===== NAČTENÍ DRAFTU =====
  useEffect(() => {
    if (hasDraft()) {
      setCanvasData(loadDraft());
      setHasUnsavedChanges(true);
    }
  }, [loadDraft, hasDraft]);

  // ===== BEFOREUNLOAD - Ochrana před odchodem =====
  useEffect(() => {
    if (!hasUnsavedChanges) return; // Nic neukládej, pokud nejsou změny

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Moderní prohlížeče ignorují vlastní text
      e.preventDefault();
      // Chrome vyžaduje returnValue
      e.returnValue = ""; // ← MUSÍ být nastaveno!
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // ===== ULOŽENÍ CANVAS DRAFTU =====
  const saveMockCanvas = (data: TemplateExportData) => {
    if (data.elements.length >= 1) {
      // Pouze v případě, že na plátně něco je. Pokud na plátně nic není, není třeba ukládat
      saveDraft(data);
      setCanvasData(data);
      setHasUnsavedChanges(true);
    } else {
      clearDraft();
      setCanvasData(null);
      setHasUnsavedChanges(false);
    }
  };

  // ===== SUBMIT FORMULÁŘE =====
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canvasData) {
      alert("Musíte vytvořit vzhled šablony!");
      return;
    }

    if(canvasData.placeholders.length <= 0) {
      alert("Šablona neobsahuje žádné proměnné!")
      return;
    }

    if (!templateName.trim()) {
      alert("Musíte vyplnit název šablony!");
      return;
    }

    mutation.mutate(
      {
        isPublic,
        name: templateName,
        placeholders: canvasData.placeholders,
        description: templateDescription,
        canvasData: JSON.stringify(canvasData),
        previewImageUrl: canvasData.previewImageUrl ?? "",
      },
      {
        onSuccess: (_data) => {
          clearDraft();
          setHasUnsavedChanges(false);
          router.push("/dashboard/me-sablony");
        },
        onError: (err) => {
          console.log(err);
          alert("Chyba při vytváření šablony.");
        },
      },
    );
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Vytvořit šablonu
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Vytvořte novou šablonu pro své certifikáty.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">
              Název šablony
            </h2>
            <Input
              type="text"
              id="name"
              placeholder="Název"
              required={true}
              onChange={(e) => setTemplateName(e.target.value)}
              className="text-base"
            />
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">
              Popis šablony
            </h2>
            <Textarea
              className="h-24 resize-none text-base"
              placeholder="Popis šablony"
              onChange={(e) => setTemplateDescription(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">
              Vzhled šablony
            </h2>
            <span className="mb-3 block text-sm text-gray-600">
              Vytvořte si, jak bude šablona vypadat.
            </span>
            <EditorDialog
              canvasData={canvasData}
              saveMockCanvas={saveMockCanvas}
            />
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">Viditelnost</h2>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="willBePublic"
                onChange={(state) => setIsPublic(state as unknown as boolean)}
              />
              <Label
                htmlFor="willBePublic"
                className="cursor-pointer text-sm font-medium"
              >
                Chcete šablonu zveřejnit?
              </Label>
            </div>
            <span className="mt-2 block text-sm text-gray-600">
              Pokud zaškrtnete, šablona bude po vytvoření dostupná k použití ve
              veřejné galerii.
            </span>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              variant="default"
              className="w-28 cursor-pointer"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Ukládám..." : "Vytvořit"}
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-28 cursor-pointer"
              onClick={(e) => {
                // Custom confirm pro Next.js Link
                if (hasUnsavedChanges) {
                  const confirm = window.confirm(
                    "Máte neuložené změny. Opravdu chcete odejít?",
                  );
                  if (!confirm) {
                    e.preventDefault();
                  }
                }
              }}
            >
              <Link href="/dashboard/me-sablony">Zrušit</Link>
            </Button>
          </div>
        </form>
      </div>
  );
}
