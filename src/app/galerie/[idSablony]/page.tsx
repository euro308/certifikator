"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  Clock,
  Download,
  FileText,
  Heart,
  Loader2,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { authClient } from "@/server/better-auth/client";
import { NavbarOutside } from "@/components/navbar-outside";
import { FooterOutside } from "@/components/footer-outside";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function GalleryTemplateDetail() {
  const params = useParams();
  const router = useRouter();
  const idSablonyRaw = params.idSablony;
  const idSablony = Array.isArray(idSablonyRaw)
    ? idSablonyRaw[0]
    : idSablonyRaw;

  const { data: session } = authClient.useSession();
  const utils = api.useUtils();

  const {
    data: template,
    isLoading,
    isError,
  } = api.templates.getTemplatePublic.useQuery(
    { templateId: idSablony ?? "" },
    { enabled: !!idSablony },
  );

  const toggleFavorite = api.templates.toggleFavorite.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.isFavorited
          ? "Šablona přidána do oblíbených"
          : "Šablona odebrána z oblíbených",
      );
      void utils.templates.getTemplatePublic.invalidate();
      void utils.templates.getPublicTemplates.invalidate();
    },
    onError: () => {
      toast.error("Nepodařilo se změnit oblíbené.");
    },
  });

  const isOwn = !!session?.user && template?.userId === session.user.id;
  const isOfficial = template?.isOfficial ?? false;

  const handleFavoriteClick = () => {
    if (!session?.user) {
      router.push("/prihlaseni");
      return;
    }
    if (!idSablony) return;
    toggleFavorite.mutate({ templateId: idSablony });
  };

  const handleUseTemplate = () => {
    if (!session?.user) {
      router.push("/prihlaseni");
      return;
    }
    router.push(`/dashboard/me-certifikaty/novy?idSablony=${idSablony}`);
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen max-w-screen flex-col">
        <NavbarOutside />
        <div className="flex-1 px-4 pt-28 pb-16">
          <DetailSkeleton />
        </div>
        <FooterOutside />
      </main>
    );
  }

  if (isError || !template) {
    return (
      <main className="flex min-h-screen max-w-screen flex-col">
        <NavbarOutside />
        <div className="flex flex-1 flex-col items-center justify-center space-y-4 px-4">
          <h1 className="text-2xl font-bold">Šablona nenalezena</h1>
          <p className="text-muted-foreground">
            Požadovaná šablona neexistuje nebo byla odstraněna.
          </p>
          <Button asChild variant="outline">
            <Link href="/galerie">Zpět do galerie</Link>
          </Button>
        </div>
        <FooterOutside />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen max-w-screen flex-col">
      <NavbarOutside />

      <div className="flex-1 px-4 pt-28 pb-16">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Breadcrumbs */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/galerie">Galerie</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{template.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  {template.name}
                </h1>
              </div>
              <p className="text-muted-foreground mt-2 text-lg">
                {isOfficial ? (
                  <span className="inline-flex items-center gap-1.5">
                    <BadgeCheck className="size-4 text-[#E65758]" />
                    Oficiální šablona od Týmu Certifikátor
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Avatar className="h-6 w-6 border bg-white">
                      <AvatarImage src={template.authorImage || undefined} alt={template.authorName} className="object-cover" />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                        {template.authorName
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || <User className="size-3" />}
                      </AvatarFallback>
                    </Avatar>
                    <span>Šablona od {template.authorName}</span>
                  </span>
                )}
              </p>
            </div>

            <div className="flex gap-2">
              {!isOwn && (
                <Button
                  variant="outline"
                  onClick={handleFavoriteClick}
                  disabled={toggleFavorite.isPending}
                  className={`gap-2 ${template.isFavorited
                    ? "border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600"
                    : "hover:text-red-500"
                    }`}
                >
                  {toggleFavorite.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Heart className="size-4" fill={template.isFavorited ? "currentColor" : "none"} />
                  )}
                  {template.isFavorited ? "Odebrat z oblíbených" : "Přidat do oblíbených"}
                </Button>
              )}
              <Button
                onClick={handleUseTemplate}
                className={
                  isOwn
                    ? "border border-[#E65758] bg-transparent text-[#E65758] hover:bg-[#E65758]/5"
                    : "bg-[#E65758] hover:bg-[#d44647] text-white"
                }
              >
                <ArrowRight className="mr-2 size-4" />
                {isOwn ? "Vaše šablona" : "Použít šablonu"}
              </Button>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-12">
            {/* Levý sloupec – náhled */}
            <div className="lg:col-span-7 xl:col-span-8">
              <Card className="overflow-hidden border-2 py-0">
                {template.previewImageUrl ? (
                  <div className="bg-muted relative aspect-[1.414/1] w-full">
                    <Image
                      src={template.previewImageUrl}
                      alt={`Náhled – ${template.name}`}
                      className="object-cover"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                    />
                  </div>
                ) : (
                  <div className="bg-muted/5 text-muted-foreground flex aspect-[1.414/1] w-full flex-col items-center justify-center">
                    <FileText className="mb-2 size-16 opacity-20" />
                    <span>Náhled není k dispozici</span>
                  </div>
                )}
              </Card>
            </div>

            {/* Pravý sloupec – info */}
            <div className="space-y-6 lg:col-span-5 xl:col-span-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informace o šabloně</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-sm font-medium">
                      Popis
                    </span>
                    <p className="text-sm leading-relaxed whitespace-normal break-words">
                      {template.description ?? "Bez popisu"}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center">
                        <User className="mr-2 size-4" /> Autor
                      </span>
                      <Link href={`./?search=${template.authorName}`} className={"underline hover:text-muted-foreground"}>{template.authorName}</Link>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center">
                        <Calendar className="mr-2 size-4" /> Vytvořeno
                      </span>
                      <span>
                        {new Date(template.createdAt).toLocaleDateString(
                          "cs-CZ",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center">
                        <Clock className="mr-2 size-4" /> Poslední úprava
                      </span>
                      <span>
                        {template.updatedAt
                          ? new Date(template.updatedAt).toLocaleDateString(
                            "cs-CZ",
                          )
                          : "-"}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center">
                        <Download className="mr-2 size-4" /> Využito
                      </span>
                      <span>{template.downloads}×</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center">
                        <Heart className="mr-2 size-4" /> Oblíbeno
                      </span>
                      <span>{template.favoritesCount}×</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </div>

      <FooterOutside />
    </main>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-8">
          <Skeleton className="h-[500px] w-full rounded-xl" />
        </div>
        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}