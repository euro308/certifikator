import { auth } from "@/server/better-auth/config";
import { headers } from "next/headers";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function MeSablony() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/prihlaseni");
  }

  const userTemplates = await api.templates.getUserTemplates();

  return (
    <div className="container mx-auto px-6">
      <div className="flex items-center justify-between mb-8">
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

      {userTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Plus className="size-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Zatím žádné šablony</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            Zatím jste nevytvořili žádnou šablonu. Začněte tou první!
          </p>
          <Button asChild>
            <Link href="/dashboard/me-sablony/nova">Vytvořit šablonu</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {userTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-medium truncate pr-2">
                    {template.name}
                  </CardTitle>
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {template.description}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vytvořeno:</span>
                    <span>{new Date(template.createdAt).toLocaleDateString("cs-CZ")}</span>
                  </div>
                  {template.updatedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Upraveno:</span>
                      <span>{new Date(template.updatedAt).toLocaleDateString("cs-CZ")}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t flex justify-end">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/me-sablony/${template.id}`}>Detail</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
