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
import React from "react";

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

// Paths that should just be text (no link) to avoid 404s
const nonLinkableSegments = ["sablona", "certifikat", "nahlaseni"];

export function BreadcrumbsByPathname() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Split path and remove empty strings (e.g. from leading slash)
  const pathSegments = pathname.split("/").filter((segment) => segment !== "");

  // Helper to get readable name
  const getBreadcrumbName = (segment: string) => {
    return breadcrumbNameMap[segment] ?? segment;
  };

  // Check for IDs in search params to append as the last crumb
  // Common ID params in the app based on context
  const idSablony = searchParams.get("idSablony");
  const idCertifikatu = searchParams.get("idCertifikatu");
  const specificId = idSablony ?? idCertifikatu;

  // Construct breadcrumbs
  const breadcrumbs = pathSegments.map((segment, index) => {
    // Reconstruct path for the link
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const name = getBreadcrumbName(segment);
    const isLast = index === pathSegments.length - 1;

    // If it's the last segment and we have a specific ID in search params,
    // this segment is likely "upravit" or similar, and we want to show the ID after it.
    // BUT user asked for: "Mé šablony > Upravit > template.id"
    // So if we have an ID, this current segment is NOT the last visual crumb.
    const isVisuallyLast = isLast && !specificId;

    // Check if this segment should be a link
    // It's a link if it's NOT the last item AND it's NOT in the nonLinkableSegments list
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

  // If we have a specific ID from query params, add it as a "fake" child
  if (specificId) {
    breadcrumbs.push({
      href: "#", // No specific link for the ID itself usually, or same page
      name: specificId,
      isLast: true,
      isLinkable: false,
      key: "param-id",
    });
  }

  // If on home/dashboard root only, or if the only segment is "dashboard"
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
