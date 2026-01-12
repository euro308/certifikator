// src/app/dashboard/layout.tsx
import { auth } from "@/server/better-auth/config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NavbarInside } from "@/components/navbar-inside";
import { FooterInside } from "@/components/footer-inside";
import React from "react";

export default async function DashboardLayout({
                                                children,
                                              }: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/prihlaseni?signedIn=false");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavbarInside />
      <main className="flex-1 w-full pt-12 lg:pt-18">
        {children}
      </main>
      <FooterInside />
    </div>
  );
}
