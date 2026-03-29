"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import React, { Suspense } from "react";

const breadcrumbNameMap: Record<string, string> = {
  dashboard: "Uživatelský panel",
  "me-sablony": "Mé šablony",
  "me-certifikaty": "Mé certifikáty",
  nova: "Nová",
  novy: "Nový",
  upravit: "Upravit",
  "nastaveni-uzivatele": "Nastavení uživatele",
  "o-projektu": "O projektu",
  funkce: "Funkce",
  prihlaseni: "Přihlášení",
  registrace: "Registrace",
  "zapomenute-heslo": "Zapomenuté heslo",
  account: "Účet",
  admin: "Administrace",
  sablona: "Šablona",
  certifikat: "Certifikát",
  nahlaseni: "Nahlášení",
};

const nonLinkableSegments = ["sablona", "certifikat", "nahlaseni"];

function BreadcrumbsByPathnameContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pathSegments = pathname.split("/").filter((segment) => segment !== "");

  const getBreadcrumbName = (segment: string) => {
    return breadcrumbNameMap[segment] ?? segment;
  };

  // Kontrola ID v parametrech vyhledávání, která se mají přidat jako poslední breadcrumb
  // Běžné parametry ID v aplikaci na základě kontextu
  const idSablony = searchParams.get("idSablony");
  const idCertifikatu = searchParams.get("idCertifikatu");
  const specificId = idSablony ?? idCertifikatu;

  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const name = getBreadcrumbName(segment);
    const isLast = index === pathSegments.length - 1;
    const isVisuallyLast = isLast && !specificId;
    const isLinkable =
      !isVisuallyLast && !nonLinkableSegments.includes(segment);

    return {
      href,
      name,
      isLast: isVisuallyLast,
      isLinkable,
      key: href,
    };
  });

  if (specificId) {
    breadcrumbs.push({
      href: "#",
      name: specificId,
      isLast: true,
      isLinkable: false,
      key: "param-id",
    });
  }

  // Pokud na domovské stránce dashboardu nebo dashboard jako jediný segment
  if (
    breadcrumbs.length === 0 ||
    (pathSegments.length === 1 && pathSegments[0] === "dashboard")
  ) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-4 px-4 pb-6 sm:px-6 lg:px-8">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => {
            return (
              <React.Fragment key={crumb.key}>
                <BreadcrumbItem>
                  {crumb.isLast ? (
                    <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                  ) : crumb.isLinkable ? (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.name}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <span className="text-muted-foreground">{crumb.name}</span>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

export function BreadcrumbsByPathname() {
  return (
    <Suspense fallback={null}>
      <BreadcrumbsByPathnameContent />
    </Suspense>
  );
}
