"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CertificateSummary } from "@/components/my-certificates/certificate-summary";

export default function MeCertifikaty() {
  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Moje certifikáty
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Přehled všech Vámi vytvořených certifikátů.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/me-certifikaty/novy">
            <Plus className="size-4" />
            Vytvořit nový
          </Link>
        </Button>
      </div>

      <CertificateSummary />
    </div>
  );
}
