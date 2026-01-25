import { auth } from "@/server/better-auth/config";
import { headers } from "next/headers";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TemplateSummary } from "@/components/my-templates/template-summary";

export default async function MeSablony() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/prihlaseni");
  }

  const userTemplates = await api.templates.getUserTemplates();

  return (
    <div className="container mx-auto px-4 py-6 md:px-6">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Moje šablony
          </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
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

      <TemplateSummary userTemplates={userTemplates} />
    </div>
  );
}
