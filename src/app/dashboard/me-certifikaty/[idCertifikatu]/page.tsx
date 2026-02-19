"use client";

import React, { useState } from "react";
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
  Mail,
  Trash2,
  User,
  Award,
  FileText,
  Clock,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/delete-dialog";
import { ResendEmailDialog } from "@/components/resend-email-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

export default function CertificateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.idCertifikatu as string;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  const { data: certificate, isLoading, isError, error } = api.certificates.getCertificate.useQuery({ id });

  const deleteMutation = api.certificates.deleteCertificate.useMutation({
    onSuccess: () => {
      toast.success("Certifikát byl úspěšně smazán.");
      router.push("/dashboard/me-certifikaty");
    },
    onError: (err) => {
      toast.error("Chyba při mazání certifikátu: " + err.message);
    },
  });

  if (isLoading) return <CertificateDetailSkeleton />;
  
  if (isError || !certificate) {
    return (
      <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center space-y-4 px-4">
        <h1 className="text-2xl font-bold">Certifikát nenalezen</h1>
        <p className="text-muted-foreground">
          {error?.message || "Požadovaný certifikát neexistuje nebo k němu nemáte přístup."}
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard/me-certifikaty">Zpět na přehled</Link>
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
           <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Certifikát pro {certificate.recipientName}
            </h1>
           </div>
           <p className="mt-2 text-lg text-muted-foreground">Detail a správa vystaveného certifikátu.</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => setIsEmailDialogOpen(true)}>
            <Mail className="mr-2 size-4" />
            Znovu odeslat e-mail
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsDeleteDialogOpen(true)} 
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="mr-2 size-4" />
            Smazat
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Levý sloupec - Náhled (Větší část) */}
        <div className="lg:col-span-7 xl:col-span-8">
            <Card className="overflow-hidden border-2 py-0">
                <div className="relative aspect-[1.414/1] w-full bg-muted">
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

        {/* Pravý sloupec - Info */}
        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
            <Card>
                <CardHeader>
                    <CardTitle>Informace o certifikátu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <span className="text-sm font-medium text-muted-foreground">Příjemce</span>
                        <div className="flex items-center gap-2 mt-1">
                            <User className="size-4 text-muted-foreground" />
                            <span className="font-semibold">{certificate.recipientName}</span>
                        </div>
                        <p className="text-sm text-muted-foreground ml-6">{certificate.recipientEmail}</p>
                    </div>
                    
                    <Separator />

                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center">
                                <Calendar className="mr-2 size-4" /> Vystaveno
                            </span>
                            <span>{new Date(certificate.createdAt).toLocaleDateString("cs-CZ")}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center">
                                <FileText className="mr-2 size-4" /> Šablona
                            </span>
                            <Link
                                href={`/dashboard/me-sablony/${certificate.templateId}`}
                                className="text-primary flex items-center gap-1 hover:underline"
                            >
                                {certificate.template.name}
                                <ExternalLink className="size-3" />
                            </Link>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <span className="text-sm font-medium text-muted-foreground">Verifikační klíč</span>
                        <div className="bg-muted rounded-md p-3">
                            <code className="break-all font-mono text-xs font-bold">
                                {certificate.validationToken}
                            </code>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                            Tento unikátní klíč slouží k ověření pravosti certifikátu na veřejné ověřovací stránce.
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
                        {Object.entries(certificate.recipientData as Record<string, string>).map(([key, value]) => (
                            <div key={key} className="flex flex-col space-y-0.5 rounded-lg border p-2.5 bg-gray-50/50">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase">{key}</span>
                                <span className="text-sm font-medium">{value}</span>
                            </div>
                        ))}
                        {Object.keys(certificate.recipientData as object).length === 0 && (
                            <p className="text-sm text-muted-foreground italic text-center py-2">Žádná doplňující data.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>

    <DeleteDialog
      type="certificate"
      open={isDeleteDialogOpen}
      onOpenChange={setIsDeleteDialogOpen}
      onConfirm={() => deleteMutation.mutate({ id })}
      onCancel={() => setIsDeleteDialogOpen(false)}
      isDeleting={deleteMutation.isPending}
    />

    <ResendEmailDialog
      open={isEmailDialogOpen}
      onOpenChange={setIsEmailDialogOpen}
      certificate={certificate}
    />
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
                     <Skeleton className="h-80 w-full rounded-xl" />
                     <Skeleton className="h-40 w-full rounded-xl" />
                </div>
            </div>
        </div>
    )
}
