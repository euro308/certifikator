import { auth } from "@/server/better-auth/config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";

export default async function NovyCertifikat() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/prihlaseni");
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Vytvořit certifikát</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Zadejte základní údaje pro nový certifikát.
        </p>
      </div>
      
      <div className="max-w-xl space-y-4">
        <div className="grid gap-2">
          <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Název certifikátu</span>
          <Input type="text" placeholder="Např. Osvědčení o absolvování kurzu"/>
        </div>
        {/* Placeholder for future form functionality */}
      </div>
    </div>
  );
}