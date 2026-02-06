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
import { DeleteTemplateDialog } from "@/components/my-templates/delete-template-dialog";
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
  const router = useRouter();
  const utils = api.useUtils();
  const hideTemplateMutation = api.templates.hideTemplate.useMutation();

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
            
             {/* Statistiky (Future proofing) */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                 <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Vydaných certifikátů
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">
                            (Připravujeme)
                        </p>
                    </CardContent>
                 </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Zobrazení
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                         <p className="text-xs text-muted-foreground">
                            (Připravujeme)
                        </p>
                    </CardContent>
                 </Card>
            </div>
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
                </CardContent>
            </Card>

            {/* Akce pro certifikáty */}
            <Card className="bg-muted/30">
                <CardHeader>
                    <CardTitle>Certifikáty</CardTitle>
                    <CardDescription>Správa certifikátů využívajících tuto šablonu.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="secondary" className="w-full justify-start" disabled>
                        <Search className="mr-2 size-4" />
                        Vyhledat certifikáty
                    </Button>
                    <Button className="w-full justify-start" asChild>
                         <Link href={`/dashboard/me-certifikaty/novy?templateId=${template.id}`}>
                            <Award className="mr-2 size-4" />
                            Vydat nový certifikát
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>

  <DeleteTemplateDialog
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
