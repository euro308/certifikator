import { auth } from "@/server/better-auth/config";
import { headers } from "next/headers";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function MeCertifikaty() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/prihlaseni");
  }

  const userCertificates = await api.certificates.getUserCertificates();

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Moje certifikáty</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Přehled všech vámi vytvořených certifikátů.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/me-certifikaty/novy">
            <Plus className="size-4" />
            Vytvořit nový
          </Link>
        </Button>
      </div>

      {userCertificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Plus className="size-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Zatím žádné certifikáty</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            Zatím jste nevytvořili žádný certifikát. Začněte tím prvním!
          </p>
          <Button asChild>
            <Link href="/dashboard/me-certifikaty/novy">Vytvořit certifikát</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {userCertificates.map((cert) => (
            <Card key={cert.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 flex justify-between">
                <div>
                <CardTitle className="text-lg font-medium truncate pr-2">
                    {cert.recipientName}
                  </CardTitle>
                <div className="text-sm text-muted-foreground truncate">
                  <span className={"text-[0.75rem]"}>{cert.id}</span>
                </div>
                </div>
                <img className="w-42 h-24 max-w-sm rounded-xl bg-gray-200 object-cover md:w-40 md:h-24" alt={`certificate-${cert.id}`}/>
              </CardHeader>
              <CardContent>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vytvořeno:</span>
                    <span>{new Date(cert.createdAt).toLocaleDateString("cs-CZ")}</span>
                  </div>
                <div className="mt-4 pt-4 border-t flex justify-end">
                   <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/me-certifikaty/${cert.id}`}>Detail</Link>
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
