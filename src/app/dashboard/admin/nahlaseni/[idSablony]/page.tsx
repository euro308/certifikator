"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {
    Trash2,
    EyeOff,
    FileText,
    Calendar,
    Globe,
    Lock,
    User,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/dialogs/delete-dialog";

export default function AdminTemplateReportDetail() {
    const params = useParams();
    const router = useRouter();
    const templateId = Array.isArray(params.idSablony)
        ? params.idSablony[0]
        : params.idSablony;

    const utils = api.useUtils();
    const { data, isLoading, isError } = api.admin.getTemplateReports.useQuery(
        { templateId: templateId ?? "" },
        { enabled: !!templateId },
    );

    const [confirmDeleteReportId, setConfirmDeleteReportId] = useState<
        string | null
    >(null);
    const [confirmTakeDownId, setConfirmTakeDownId] = useState<boolean>(false);

    const deleteReport = api.admin.deleteReport.useMutation({
        onSuccess: () => {
            toast.success("Nahlášení úspěšně smazáno (zamítnuto).");
            setConfirmDeleteReportId(null);
            void utils.admin.getTemplateReports.invalidate();
            void utils.admin.getReports.invalidate();
        },
        onError: (err) =>
            toast.error(err.message || "Nepodařilo se smazat report."),
    });

    const takeDownTemplate = api.admin.takeDownTemplate.useMutation({
        onSuccess: () => {
            toast.success("Šablona byla skryta z veřejné galerie a reporty smazány.");
            setConfirmTakeDownId(false);
            void utils.admin.getTemplateReports.invalidate();
            void utils.admin.getReports.invalidate();
            router.push("/dashboard/admin");
        },
        onError: (err) => toast.error(err.message || "Chyba při skrývání šablony."),
    });

    if (isLoading) {
        return <TemplateDetailSkeleton />;
    }

    if (isError || !data?.template) {
        return (
            <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center space-y-4 px-4">
                <h1 className="text-2xl font-bold">Data nenalezena</h1>
                <p className="text-muted-foreground">
                    Šablona nebo reporty nebyly nalezeny (nebo už byla šablona ze systému
                    odstraněna).
                </p>
                <Button asChild variant="outline">
                    <Link href="/dashboard/admin">Zpět na přehled</Link>
                </Button>
            </div>
        );
    }

    const { template, reports } = data;

    return (
        <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
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
                                    <Lock className="mr-1 size-3" /> Skrytá
                                </>
                            )}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Detail nahlášené šablony.
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/galerie/${template.id}`} target="_blank">
                            <Globe className="mr-2 size-4" />
                            Zobrazit v galerii
                        </Link>
                    </Button>
                    <Button onClick={() => setConfirmTakeDownId(true)}>
                        <EyeOff className="mr-2 size-4" />
                        Skrýt šablonu z galerie
                    </Button>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Levý sloupec - Náhled (Větší část) */}
                <div className="lg:col-span-7 xl:col-span-8">
                    <Card className="overflow-hidden border-2 border-red-50 py-0">
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

                {/* Pravý sloupec - Info & Nahlášení */}
                <div className="space-y-6 lg:col-span-5 xl:col-span-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informace o šabloně</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <span className="text-muted-foreground text-sm font-medium">
                                    Popis šablony
                                </span>
                                <p className="text-sm leading-relaxed break-words whitespace-normal text-gray-700">
                                    {template.description ?? "Bez popisu"}
                                </p>
                            </div>

                            <Separator />

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center">
                                        <User className="mr-2 size-4" /> Autor šablony
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        {template.authorName}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center">
                                        <Calendar className="mr-2 size-4" /> Vytvořeno
                                    </span>
                                    <span>
                                        {new Date(template.createdAt).toLocaleDateString("cs-CZ")}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Akce pro nahlášení */}
                    <Card className="border-red-100 bg-red-50/40">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600">
                                Přijatá nahlášení ({reports.length})
                            </CardTitle>
                            <CardDescription>
                                Seznam důvodů, proč uživatelé šablonu nahlásili.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {reports.length === 0 ? (
                                <div className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-gray-500">
                                    Nejsou evidována žádná nahlášení.
                                </div>
                            ) : (
                                <div className="w-full space-y-3">
                                    {reports.map((report) => (
                                        <div
                                            key={report.id}
                                            className="flex w-full flex-col gap-3 rounded-lg border bg-white p-4 shadow-sm"
                                        >
                                            {/* Header reportu: jméno, datum, tlačítko */}
                                            <div className="flex w-full items-start justify-between">
                                                <div className="flex min-w-0 flex-col">
                                                    <span
                                                        className="truncate text-sm font-semibold text-gray-900"
                                                        title={report.reporterName}
                                                    >
                                                        {report.reporterName}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(report.createdAt).toLocaleString(
                                                            "cs-CZ",
                                                            { dateStyle: "short", timeStyle: "short" },
                                                        )}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="-mt-1 -mr-2 shrink-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                                    onClick={() => setConfirmDeleteReportId(report.id)}
                                                    title="Zamítnout nahlášení (Smazat bez akce)"
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>

                                            {/* Samotný text nahlášení - roztažení na celou šířku boxíku */}
                                            <div className="w-full rounded-md border border-red-50 bg-red-50/50 p-3 text-sm break-words text-gray-800">
                                                {report.reason}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Dialog pro smazání 1 konkrétního reportu */}
            <DeleteDialog
                type="report"
                open={!!confirmDeleteReportId}
                onOpenChange={(v: boolean) => !v && setConfirmDeleteReportId(null)}
                onCancel={() => setConfirmDeleteReportId(null)}
                onConfirm={() => {
                    if (confirmDeleteReportId) {
                        deleteReport.mutate({ reportId: confirmDeleteReportId });
                    }
                }}
                isDeleting={deleteReport.isPending}
            />

            {/* Dialog pro vyřešení celé šablony */}
            <DeleteDialog
                type="take-down-template"
                open={confirmTakeDownId}
                onOpenChange={setConfirmTakeDownId}
                onCancel={() => setConfirmTakeDownId(false)}
                onConfirm={(reason?: string) => {
                    if (templateId) {
                        takeDownTemplate.mutate({
                            templateId,
                            reason:
                                reason ??
                                "Porušení pravidel komunity na základě uživatelského nahlášení.",
                        });
                    }
                }}
                isDeleting={takeDownTemplate.isPending}
            />
        </div>
    );
}

function TemplateDetailSkeleton() {
    return (
        <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-48" />
                </div>
            </div>
            <div className="grid gap-8 lg:grid-cols-12">
                <div className="lg:col-span-8">
                    <Skeleton className="h-[500px] w-full rounded-xl" />
                </div>
                <div className="space-y-6 lg:col-span-4">
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}
