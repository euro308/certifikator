"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import React from "react";
import {
    Calendar,
    Globe,
    Lock,
    FileText,
    Award,
    Clock,
    Users,

} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDetailSablony() {
    const params = useParams();
    const idSablonyRaw = params.idSablony;
    const idSablony = Array.isArray(idSablonyRaw)
        ? idSablonyRaw[0]
        : idSablonyRaw;

    // Načtení dat šablony přes admin endpoint
    const {
        data: template,
        isLoading,
        isError,
    } = api.admin.getTemplateById.useQuery(
        { templateId: idSablony ?? "" },
        {
            enabled: !!idSablony,
        },
    );

    const router = useRouter();

    if (isLoading) {
        return (
            <div className="container mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-[500px] w-full" />
            </div>
        );
    }

    if (isError || !template) {
      return (
        <div className="container mx-auto flex min-h-[50vh] max-w-7xl flex-col items-center justify-center space-y-4 px-4">
          <FileText className="text-muted-foreground size-16 opacity-50" />
          <h2 className="text-foreground text-2xl font-semibold">
            Šablona nenalezena
          </h2>
          <p className="text-muted-foreground max-w-md text-center">
            Omlouváme se, ale tato šablona nebyla nalezena.
          </p>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/dashboard/admin">Zpět do Administrace</Link>
          </Button>
        </div>
      );
    }
    const handleCreateCertificate = () => {
        router.push(`/dashboard/me-certifikaty/novy?idSablony=${template.id}`);
    };

    return (
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
                                <>
                                    <Globe className="mr-1 size-3" /> Veřejná
                                </>
                            ) : (
                                <>
                                    <Lock className="mr-1 size-3" /> Soukromá
                                </>
                            )}
                        </Badge>
                    </div>
                </div>

                    <Button
                        onClick={handleCreateCertificate}
                    >
                        <Award className="mr-2 size-4" />
                        Vytvořit certifikát
                    </Button>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Levý sloupec - náhled (větší část) */}
                <div className="lg:col-span-7 xl:col-span-8">
                    <Card className="overflow-hidden border-2 py-0">
                        {template.previewImageUrl ? (
                            <div className="bg-muted relative aspect-[1.414/1] w-full">
                                <Image
                                    src={template.previewImageUrl}
                                    alt={`Náhled - ${template.name}`}
                                    className="object-cover"
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                                />
                            </div>
                        ) : (
                            <div className="bg-muted/5 text-muted-foreground relative flex aspect-[1.414/1] w-full flex-col items-center justify-center py-20">
                                <FileText className="mb-2 size-16 opacity-20" />
                                <span>Náhled není k dispozici</span>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Pravý sloupec - info */}
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
                                <p className="text-sm leading-relaxed break-words whitespace-normal">
                                    {template.description ?? "Bez popisu"}
                                </p>
                            </div>

                            <Separator />

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center">
                                        <Calendar className="mr-2 size-4" /> Vytvořeno
                                    </span>
                                    <span>
                                        {new Date(template.createdAt).toLocaleDateString("cs-CZ")}
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
                                        <Users className="mr-2 size-4" /> Autor
                                    </span>
                                    <span>
                                        {template.authorName}
                                    </span>
                                </div>
                                <div className="flex gap-1 justify-between">
                                  <div className="flex">
                                    <FileText className="mr-2 size-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">E-mail</span>
                                  </div>
                                    <span className="truncate block">
                                        {template.user?.email || "Nedostupné"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center">
                                        <Globe className="mr-2 size-4" /> Oficiální
                                    </span>
                                    <span>
                                        {(template.userId === process.env.OFFICIAL_USER_ID) ? "Ano" : "Ne"}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
