import { auth } from "@/server/better-auth/config";
import { headers } from "next/headers";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TemplateSummary } from "@/components/my-templates/template-summary";

export default async function MeSablony() {
  let searchValue = "";
  const setSearchValue = (value: string) => {
    searchValue = value;
  }


  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/prihlaseni");
  }

  const userTemplates = await api.templates.getUserTemplates();

  return (
    <div className="container mx-auto px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Moje šablony</h1>
          <p className="text-muted-foreground mt-2">
            Přehled všech vámi vytvořených šablon.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/me-sablony/nova">
            <Plus className="size-4" />
            Vytvořit novou
          </Link>
        </Button>
      </div>

      <TemplateSummary userTemplates={userTemplates} />
    </div>
  );
}
