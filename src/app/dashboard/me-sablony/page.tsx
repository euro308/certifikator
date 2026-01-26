"use client"

import { api } from "@/trpc/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TemplateSummary } from "@/components/my-templates/template-summary";

export default function MeSablony() {
  const { data: userTemplates, isLoading } = api.templates.getUserTemplates.useQuery();

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Moje šablony
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Přehled všech vámi vytvořených šablon.
          </p>
        </div>
        <Button asChild className="w-full md:w-auto">
          <Link href="/dashboard/me-sablony/nova">
             <Plus className="mr-2 size-4" />
            Vytvořit novou
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <span className="text-muted-foreground">Načítám šablony...</span>
        </div>
      ) : <TemplateSummary userTemplates={userTemplates ?? []} />}
    </div>
  );
}
