import { auth } from "@/server/better-auth/config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NavbarInside } from "@/components/navigation/navbar-inside";
import { FooterInside } from "@/components/navigation/footer-inside";
import React from "react";
import { BreadcrumbsByPathname } from "@/components/navigation/breadcrumbs-by-pathname";

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
      <main className="w-full flex-1 pt-22 pb-10 lg:pt-28">
        <BreadcrumbsByPathname />
        {children}
      </main>
      <FooterInside />
    </div>
  );
}
