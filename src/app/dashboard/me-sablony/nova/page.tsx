"use client";

import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import { EditorDialog } from "@/components/editor-dialog";
import { X, SquarePen } from "lucide-react";
import Link from "next/link";

export default function NovaSablona() {
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [canvasData, setCanvasData] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const mutation = api.templates.createTemplate.useMutation();

  const saveMockCanvas = () => {
    console.log("Zatím prázdné");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Zatím prázdné");

    if (templateName == "") {
      toast("Chyba!");
    }
  };

  return (
    <main className="min-h-[80vh] pt-10 pb-10">
      <div className="mx-auto max-w-4xl px-6">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">
          Vytvořit šablonu
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">
              Název šablony
            </h2>
            <Input
              type="text"
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
              className="resize-none text-base h-24"
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

          <div className="flex gap-4 pt-4">
            <Button type="submit" variant="default" className="w-28">
              <SquarePen className="size-4"/>Vytvořit
            </Button>
            <Button type="button" variant="outline" className="w-24">
              <X className="size-4"/>
              <Link href="/dashboard/me-sablony">Zrušit</Link>
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
