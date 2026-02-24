"use client";

import React from "react";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Loader2, Copy, ExternalLink, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

export function CertificatesTab() {
  const [userIdInput, setUserIdInput] = React.useState("");
  const [activeUserId, setActiveUserId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  const {
    data: certificates,
    isLoading,
    isError,
  } = api.admin.getUserCertificates.useQuery(
    { userId: activeUserId ?? "" },
    { enabled: !!activeUserId },
  );

  const handleCopyId = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(id);
      toast.success("ID certifikátu zkopírováno");
    } catch {
      toast.error("Nepodařilo se zkopírovat ID");
    }
  };

  const handleLoadCertificates = (e: React.FormEvent) => {
    e.preventDefault();
    if (userIdInput.trim()) {
      setActiveUserId(userIdInput.trim());
      setSearchQuery("");
    }
  };

  const filteredCerts =
    certificates?.filter((c) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.recipientName.toLowerCase().includes(q) ||
        c.recipientEmail.toLowerCase().includes(q) ||
        c.userId.toLowerCase().includes(q)
      );
    }) ?? [];

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleLoadCertificates}
        className="bg-card flex max-w-lg items-center gap-2 rounded-xl border p-4 shadow-sm"
      >
        <Search className="text-muted-foreground mr-1 size-5" />
        <Input
          placeholder="Zadejte ID uživatele..."
          value={userIdInput}
          onChange={(e) => setUserIdInput(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={!userIdInput.trim()}>
          Načíst certifikáty
        </Button>
      </form>

      {!activeUserId && (
        <div className="bg-muted/10 flex min-h-[300px] flex-col items-center justify-center space-y-4 rounded-md border border-dashed p-12">
          <FileText className="text-muted-foreground size-12 opacity-20" />
          <p className="text-muted-foreground text-center">
            Pro načtení certifikátů zadejte konkrétní ID uživatele. <br />
            Kvůli datové náročnosti nelze najednou načíst úplně všechny
            certifikáty v systému.
          </p>
        </div>
      )}

      {activeUserId && isLoading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-[300px]" />
          </div>
          <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 rounded-md border p-6">
            <Loader2 className="text-muted-foreground size-8 animate-spin" />
            <p className="text-muted-foreground">
              Načítám certifikáty uživatele...
            </p>
          </div>
        </div>
      )}

      {activeUserId && isError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          Při načítání certifikátů došlo k chybě. Zkontrolujte, zda je zadané ID
          uživatele platné.
        </div>
      )}

      {activeUserId && certificates && (
        <div className="space-y-4">
          <div className="relative flex max-w-sm items-center gap-2">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Zpřesnit hledání (dle příjemce, ID...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="bg-card relative max-h-[600px] overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-card sticky top-0 z-10 shadow-sm">
                    ID
                  </TableHead>
                  <TableHead className="bg-card sticky top-0 z-10 shadow-sm">
                    Příjemce
                  </TableHead>
                  <TableHead className="bg-card sticky top-0 z-10 shadow-sm">
                    E-mail
                  </TableHead>
                  <TableHead className="bg-card sticky top-0 z-10 shadow-sm">
                    ID šablony
                  </TableHead>
                  <TableHead className="bg-card sticky top-0 z-10 shadow-sm">
                    Datum vystavení
                  </TableHead>
                  <TableHead className="bg-card sticky top-0 z-10 text-right shadow-sm">
                    Akce
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCerts.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell>
                      <div className="group flex items-center gap-2">
                        <span
                          className="text-muted-foreground font-mono text-xs select-none"
                          title={cert.id}
                        >
                          {cert.id.substring(0, 8)}...
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={(e) => handleCopyId(cert.id, e)}
                          title="Zkopírovat ID"
                        >
                          <Copy className="size-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {cert.recipientName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cert.recipientEmail}
                    </TableCell>
                    <TableCell>
                      <div className="group flex items-center gap-2">
                        <Link
                          href={`/dashboard/admin/sablona/${cert.templateId}`}
                          className="text-primary flex items-center gap-1 hover:underline"
                        >
                          {cert.templateId.substring(0, 8)}...
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={(e) => handleCopyId(cert.templateId, e)}
                          title="Zkopírovat ID"
                        >
                          <Copy className="size-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(cert.createdAt), "dd. MM. yyyy", {
                        locale: cs,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                            >
                              <Link
                                href={`/dashboard/admin/certifikat/${cert.id}`}
                              >
                                <ExternalLink className="text-muted-foreground size-4" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Detail certifikátu</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCerts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Tento uživatel zatím nevystavil žádné certifikáty (nebo
                      neodpovídají hledání).
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
