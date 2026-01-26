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
import { useParams, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function UpravitSablonu() {
  const router = useRouter();
  const utils = api.useUtils();
  const params = useParams();
  const idSablonyRaw = params.idSablony;
  const idSablony = Array.isArray(idSablonyRaw)
    ? idSablonyRaw[0]
    : idSablonyRaw;

  const { saveDraft, loadDraft, clearDraft, hasDraft } = useTemplateDraft();

  // Fetch template data
  const {
    data: template,
    isLoading,
    isError,
  } = api.templates.getTemplateById.useQuery(
    { templateId: idSablony ?? "" },
    {
      enabled: !!idSablony,
    },
  );

  const updateMutation = api.templates.updateTemplate.useMutation();

  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [canvasData, setCanvasData] = useState<TemplateExportData | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Initialize state when template data is fetched
  useEffect(() => {
    if (template && !isDataLoaded) {
      setTemplateName(template.name);
      setTemplateDescription(template.description ?? "");
      setIsPublic(template.isPublic ?? false);

      if (hasDraft()) {
        const draft = loadDraft();
        setCanvasData(draft);
        setHasUnsavedChanges(true);
        toast.info("Načten automaticky uložený koncept.");
      } else {
        // Ensure canvasData is typed correctly
        setCanvasData(template.canvasData as TemplateExportData);
      }
      setIsDataLoaded(true);
    }
  }, [template, hasDraft, loadDraft, isDataLoaded]);

  // ===== BEFOREUNLOAD - Protection against leaving with unsaved changes =====
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // ===== SAVE CANVAS DRAFT =====
  const saveMockCanvas = (data: TemplateExportData) => {
    if (data.elements.length >= 1) {
      saveDraft(data);
      setCanvasData(data);
      setHasUnsavedChanges(true);
    } else {
      clearDraft();
      setCanvasData(null);
      setHasUnsavedChanges(false);
    }
  };

  // ===== SUBMIT FORM =====
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!idSablony) {
      toast.error("Chybí ID šablony.");
      return;
    }

    if (!canvasData) {
      toast.error("Musíte vytvořit vzhled šablony!");
      return;
    }

    if (canvasData.placeholders.length <= 0) {
      toast.error("Šablona neobsahuje žádné proměnné!");
      return;
    }

    if (!templateName.trim()) {
      toast.error("Musíte vyplnit název šablony!");
      return;
    }

    updateMutation.mutate(
      {
        id: idSablony,
        isPublic,
        name: templateName,
        placeholders: canvasData.placeholders,
        description: templateDescription,
        canvasData: canvasData, // JSON structure is handled by TRPC/SuperJSON usually
        previewImageUrl: canvasData.previewImageUrl ?? "",
      },
      {
        onSuccess: () => {
          clearDraft();
          setHasUnsavedChanges(false);
          const toastId = toast.loading("Ukládám změny...");

          void (async () => {
            try {
              // Mark as stale and force fetch to ensure data is ready before navigation
              await utils.templates.getUserTemplates.invalidate();
              if (idSablony) {
                await utils.templates.getTemplateById.invalidate({
                  templateId: idSablony,
                });
              }
              await utils.templates.getUserTemplates.fetch();

              toast.dismiss(toastId);
              toast.success("Šablona byla úspěšně upravena.");
              router.push("/dashboard/me-sablony");
              router.refresh();
            } catch (error) {
              console.error("Failed to refresh templates:", error);
              toast.dismiss(toastId);
              // Fallback navigation
              router.push("/dashboard/me-sablony");
            }
          })();
        },
        onError: (err) => {
          console.error(err);
          toast.error(
            err.message || "Chyba při úpravě šablony. Zkuste to prosím znovu.",
          );
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Spinner className="text-primary size-10" />
        <span className="ml-3 text-lg text-gray-600">Načítám šablonu...</span>
      </div>
    );
  }

  if (isError || (!isLoading && !template)) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Šablona nebyla nalezena
        </h2>
        <p className="mb-6 text-gray-600">
          Požadovaná šablona neexistuje nebo k ní nemáte přístup.
        </p>
        <Button asChild>
          <Link href="/dashboard/me-sablony">Zpět na přehled</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="min-h-[80vh] pt-4 pb-4">
      <div className="mx-auto max-w-4xl px-6">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">
          Upravit šablonu
        </h1>

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
              value={templateName}
              onChange={(e) => {
                setTemplateName(e.target.value);
                setHasUnsavedChanges(true);
              }}
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
              value={templateDescription}
              onChange={(e) => {
                setTemplateDescription(e.target.value);
                setHasUnsavedChanges(true);
              }}
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
                checked={isPublic}
                onCheckedChange={(checked) => {
                  setIsPublic(checked === true);
                  setHasUnsavedChanges(true);
                }}
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
              className="w-32 cursor-pointer"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Ukládám..." : "Uložit změny"}
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-28 cursor-pointer"
              onClick={(e) => {
                // Custom confirm for Next.js Link
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
    </main>
  );
}
