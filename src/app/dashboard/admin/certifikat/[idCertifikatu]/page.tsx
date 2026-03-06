"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Calendar,
    ExternalLink,
    User,
    FileText,

} from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { downloadFile } from "@/lib/download-helper";
import { Download } from "lucide-react";

export default function AdminCertificateDetailPage() {
    const params = useParams();
    useRouter();
    const id = params.idCertifikatu as string;

    const {
        data: certificate,
        isLoading,
        isError,
        error,
    } = api.admin.getCertificateById.useQuery({ id });

    if (isLoading) return <CertificateDetailSkeleton />;

    if (isError || !certificate) {
        return (
            <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center space-y-4 px-4 max-w-7xl">
                <h1 className="text-2xl font-bold">Certifikát nenalezen</h1>
                <p className="text-muted-foreground">
                    {error?.message ??
                        "Požadovaný certifikát neexistuje nebo k němu nemáte přístup."}
                </p>
                <Button asChild variant="outline">
                    <Link href="/dashboard/admin">Zpět na přehled</Link>
                </Button>
            </div>
        );
    }

    return (
        <>
            <div className="container mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
                {/* Header s navigací zpět a titulkem */}
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            Certifikát pro {certificate.recipientName}
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Administrátorský náhled detailu o vystaveném certifikátu.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                downloadFile(certificate.certificateUrl, `${certificate.validationToken}.png`);
                            }}
                        >
                            <Download className="mr-2 size-4" />
                            Stáhnout
                        </Button>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Levý sloupec - náhled (větší část) */}
                    <div className="lg:col-span-7 xl:col-span-8">
                        <Card className="overflow-hidden border-2 py-0">
                            <div className="bg-muted relative aspect-[1.414/1] w-full">
                                <Image
                                    src={certificate.certificateUrl}
                                    alt={`Certifikát - ${certificate.recipientName}`}
                                    className="object-contain"
                                    fill
                                    priority
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                                />
                            </div>
                        </Card>
                    </div>

                    {/* Pravý sloupec - info */}
                    <div className="space-y-6 lg:col-span-5 xl:col-span-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informace o certifikátu</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <span className="text-muted-foreground text-sm font-medium">
                                        Příjemce
                                    </span>
                                    <div className="mt-1 flex items-center gap-2">
                                        <User className="text-muted-foreground size-4" />
                                        <span className="font-semibold">
                                            {certificate.recipientName}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground ml-6 text-sm">
                                        {certificate.recipientEmail}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-muted-foreground text-sm font-medium">
                                        Tvůrce certifikátu
                                    </span>
                                    <div className="mt-1 flex items-center gap-2">
                                        <User className="text-muted-foreground size-4" />
                                        <span className="font-semibold">
                                            {certificate.creatorName}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground ml-6 text-sm">
                                        {certificate.user?.email || "Neznámý e-mail"}
                                    </p>
                                </div>

                                <Separator />

                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground flex items-center">
                                            <Calendar className="mr-2 size-4" /> Vystaveno
                                        </span>
                                        <span>
                                            {new Date(certificate.createdAt).toLocaleDateString(
                                                "cs-CZ",
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground flex items-center">
                                            <FileText className="mr-2 size-4" /> Šablona
                                        </span>
                                        <Link
                                            href={`/dashboard/admin/sablona/${certificate.templateId}`}
                                            className="text-primary flex items-center gap-1 hover:underline text-right max-w-[200px] truncate"
                                            title={certificate.template.name}
                                        >
                                            <span className="truncate">{certificate.template.name}</span>
                                            <ExternalLink className="size-3 flex-shrink-0" />
                                        </Link>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <span className="text-muted-foreground text-sm font-medium">
                                        Identifikační klíč
                                    </span>
                                    <div className="bg-muted rounded-md p-3">
                                        <code className="font-mono text-xs font-bold break-all">
                                            {certificate.validationToken}
                                        </code>
                                    </div>
                                    <p className="text-muted-foreground text-[10px] leading-tight">
                                        Tento unikátní klíč slouží k ověření pravosti certifikátu na
                                        veřejné ověřovací stránce.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Doplňující data</CardTitle>
                                <CardDescription>Data použitá pro generování</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-3">
                                    {Object.entries(
                                        certificate.recipientData as Record<string, string>,
                                    ).map(([key, value]) => (
                                        <div
                                            key={key}
                                            className="flex flex-col space-y-0.5 rounded-lg border bg-gray-50/50 p-2.5"
                                        >
                                            <span className="text-muted-foreground text-[10px] font-medium uppercase">
                                                {key}
                                            </span>
                                            <span className="text-sm font-medium">{value}</span>
                                        </div>
                                    ))}
                                    {Object.keys(certificate.recipientData as object).length ===
                                        0 && (
                                            <p className="text-muted-foreground py-2 text-center text-sm italic">
                                                Žádná doplňující data.
                                            </p>
                                        )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

function CertificateDetailSkeleton() {
    return (
        <div className="container mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-5 w-96" />
                </div>
            </div>
            <div className="grid gap-8 lg:grid-cols-12">
                <div className="lg:col-span-8">
                    <Skeleton className="h-[500px] w-full rounded-xl" />
                </div>
                <div className="space-y-6 lg:col-span-4">
                    <Skeleton className="h-80 w-full rounded-xl" />
                    <Skeleton className="h-40 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}
