"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authClient } from "@/server/better-auth/client";
import { LogIn, ArrowRight, UserPlus } from "lucide-react";

export function HeroCTA() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <div className="h-14 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-14 w-48 animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Button
          size="lg"
          className="bg-gradient-primary px-8 py-6 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:opacity-90 hover:shadow-xl"
          asChild
        >
          <Link href="/dashboard">
            <ArrowRight className="mr-2 size-5" />
            Vstup do systému
          </Link>
        </Button>
      </div>
    );
  }

  // User není přihlášen
  return (
    <div className="mt-10 flex flex-col gap-4 sm:flex-row">
      <Button
        size="lg"
        className="bg-gradient-primary px-8 py-6 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:opacity-90 hover:shadow-xl"
        asChild
      >
        <Link href="/registrace">
          <UserPlus className="mr-2 size-5" />
          Registrovat se
        </Link>
      </Button>

      <Button
        size="lg"
        variant="outline"
        className="border-2 border-[#E65758] px-8 py-6 text-lg font-semibold text-[#E65758] transition-all duration-200 hover:bg-red-50"
        asChild
      >
        <Link href="/prihlaseni">
          <LogIn className="mr-2 size-5" />
          Přihlásit se
        </Link>
      </Button>
    </div>
  );
}
