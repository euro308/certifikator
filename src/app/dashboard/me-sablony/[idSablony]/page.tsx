"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";
import {
  Edit,
  Trash2,
  Calendar,
  Globe,
  Lock,
  FileText,
  Search,
  Award,
  Clock,
  Users,
  Heart,
  Loader2,
  Mail,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteDialog } from "@/components/delete-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function DetailSablony() {
  const params = useParams();
  const idSablonyRaw = params.idSablony;
  const idSablony = Array.isArray(idSablonyRaw)
    ? idSablonyRaw[0]
    : idSablonyRaw;

  // Fetch template data
  const {
    data: template,
    isLoading,
    isError,
  } = api.templates.getTemplateById.useQuery(
    { templateId: idSablony ?? "" },
    {
      enabled: !!idSablony,
    },
  );

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [showCertificates, setShowCertificates] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const utils = api.useUtils();
  const hideTemplateMutation = api.templates.hideTemplate.useMutation();

  // Fetch certificates for this template (lazy — only when expanded)
  const {
    data: templateCertificates,
    isLoading: certsLoading,
  } = api.certificates.getByTemplate.useQuery(
    { templateId: idSablony ?? "" },
    { enabled: !!idSablony && showCertificates },
  );

  const filteredCertificates = templateCertificates?.filter((cert) => {
    const search = searchTerm.toLowerCase();
    const dateStr = new Date(cert.createdAt).toLocaleDateString("cs-CZ");
    return (
      cert.recipientName.toLowerCase().includes(search) ||
      cert.recipientEmail.toLowerCase().includes(search) ||
      cert.id.toLowerCase().includes(search) ||
      dateStr.includes(search)
    );
  });

  // Fetch public stats (only for public templates)
  const { data: publicStats } = api.templates.getPublicStats.useQuery(
    { templateId: idSablony ?? "" },
    { enabled: !!idSablony && !!template?.isPublic },
  );

  const hideTemplateFromUser = () => {
    if (!idSablony) return;

    const toastId = toast.loading("Šablona se maže...");

    hideTemplateMutation.mutate(
      {
        id: idSablony,
      },
      {
        onSuccess: (_data) => {
          setDeleteDialog(false);

          void utils.templates.getUserTemplates.invalidate().then(() => {
            toast.dismiss(toastId);
            toast.success("Šablona byla úspěšně smazána");
            router.push("/dashboard/me-sablony");
          });
        },
        onError: (err) => {
          console.log(err);
          toast.dismiss(toastId);
          toast.error("Chyba při mazání šablony");
        },
      },
    );
  };

  if (isLoading) {
    return <TemplateDetailSkeleton />;
  }

  if (isError || !template) {
    return (
      <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center space-y-4 px-4">
        <h1 className="text-2xl font-bold">Šablona nenalezena</h1>
        <p className="text-muted-foreground">
          Požadovaná šablona neexistuje nebo k ní nemáte přístup.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard/me-sablony">Zpět na přehled</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Header s navigací zpět a titulkem */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {template.name}
              </h1>
              <Badge variant={template.isPublic ? "default" : "secondary"}>
                {template.isPublic ? (
                  <><Globe className="mr-1 size-3" /> Veřejná</>
                ) : (
                  <><Lock className="mr-1 size-3" /> Soukromá</>
                )}
              </Badge>
            </div>
            <p className="mt-2 text-lg text-muted-foreground">Detail a správa vaší šablony.</p>
          </div>

          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/dashboard/me-sablony/${template.id}/upravit?returnToList=false`}>
                <Edit className="mr-2 size-4" />
                Upravit design
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setDeleteDialog(true)} className="text-destructive hover:bg-destructive/10">
              <Trash2 className="mr-2 size-4" />
              Smazat
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Levý sloupec - Náhled (Větší část) */}
          <div className="lg:col-span-7 xl:col-span-8">
            <Card className="overflow-hidden border-2 py-0">
              {template.previewImageUrl ? (
                <div className="relative aspect-[1.414/1] w-full bg-muted">
                  <Image
                    src={template.previewImageUrl}
                    alt={`Náhled - ${template.name}`}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                  />
                </div>
              ) : (
                <div className="relative aspect-[1.414/1] w-full bg-muted/5 flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <FileText className="size-16 mb-2 opacity-20" />
                  <span>Náhled není k dispozici</span>
                </div>
              )}
            </Card>
          </div>

          {/* Pravý sloupec - Info */}
          <div className="space-y-6 lg:col-span-5 xl:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Informace o šabloně</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Popis</span>
                  <p className="text-sm leading-relaxed">
                    {template.description ?? "Bez popisu"}
                  </p>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <Calendar className="mr-2 size-4" /> Vytvořeno
                    </span>
                    <span>{new Date(template.createdAt).toLocaleDateString("cs-CZ")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <Clock className="mr-2 size-4" /> Poslední úprava
                    </span>
                    <span>{template.updatedAt ? new Date(template.updatedAt).toLocaleDateString("cs-CZ") : "-"}</span>
                  </div>
                </div>

                <Separator />

                {/* Veřejné statistiky — jen pro public šablony */}
                {(template.isPublic && publicStats) && (
                  <>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center">
                          <Users className="mr-2 size-4" /> Použito ostatními uživateli
                        </span>
                        <span>{publicStats.usageByOthers}×</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center">
                          <Heart className="mr-2 size-4" /> Oblíbeno ostatními uživateli
                        </span>
                        <span>{publicStats.favoritesCount}×</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Akce pro certifikáty */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle>Certifikáty</CardTitle>
                <CardDescription>Správa certifikátů využívajících tuto šablonu.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => setShowCertificates(!showCertificates)}
                >
                  <Search className="mr-2 size-4" />
                  Vyhledat certifikáty
                  {showCertificates ? (
                    <ChevronUp className="ml-auto size-4" />
                  ) : (
                    <ChevronDown className="ml-auto size-4" />
                  )}
                </Button>

                {/* Expandable certificate list */}
                {showCertificates && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Hledat jméno, email, ID..."
                        className="pl-9 h-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto rounded-md border bg-white">
                      {certsLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Načítám certifikáty...</span>
                        </div>
                      ) : !templateCertificates || templateCertificates.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Žádné certifikáty nebyly vytvořeny z této šablony.
                        </div>
                      ) : filteredCertificates?.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Nebyly nalezeny žádné certifikáty odpovídající hledání.
                        </div>
                      ) : (
                        <div className="divide-y">
                          {filteredCertificates?.map((cert) => (
                            <Link
                              key={cert.id}
                              href={`/dashboard/me-certifikaty/${cert.id}`}
                              className="flex items-center gap-3 p-3 transition-colors hover:bg-gray-50"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {cert.recipientName}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {cert.recipientEmail}
                                </p>
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-0.5">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(cert.createdAt).toLocaleDateString("cs-CZ")}
                                </span>
                                {cert.sentAt && (
                                  <span className="flex items-center text-xs text-green-600">
                                    <Mail className="mr-1 size-3" /> Odesláno
                                  </span>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button className="w-full justify-start" asChild>
                  <Link href={`/dashboard/me-certifikaty/novy?idSablony=${template.id}`}>
                    <Award className="mr-2 size-4" />
                    Vydat nový certifikát
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <DeleteDialog
        type={"template"}
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        onConfirm={hideTemplateFromUser}
        onCancel={() => setDeleteDialog(false)}
        isDeleting={hideTemplateMutation.isPending}
      />
    </>
  );
}

function TemplateDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
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
        <div className="lg:col-span-8">
          <Skeleton className="h-[500px] w-full rounded-xl" />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
