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
import { Search, Loader2, Copy, ExternalLink, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import { downloadFile } from "@/lib/download-helper";
import { useDebounce } from "@/hooks/use-debounce";

export function CertificatesTab() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isFetching,
  } = api.admin.getAllCertificates.useInfiniteQuery(
    {
      limit: 20,
      search: debouncedSearchQuery || undefined,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const certificates = data?.pages.flatMap((page) => page.items) ?? [];
  const loadMoreRef = React.useRef<HTMLTableRowElement>(null);
  const utils = api.useUtils();

  React.useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "400px" },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCopyId = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(id);
      toast.success("ID zkopírováno");
    } catch {
      toast.error("Nepodařilo se zkopírovat ID");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[300px]" />
        </div>
        <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 rounded-md border p-6">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
          <p className="text-muted-foreground">Načítám certifikáty...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative flex max-w-sm items-center gap-2">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="hledat dle ID certifikátu, uživatele, příjemce..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          disabled={isFetching}
        />
      </div>

      <div className="bg-card relative rounded-md border [&>div]:max-h-[600px] [&>div]:overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-card sticky top-0 z-10 shadow-sm">
                ID certifikátu
              </TableHead>
              <TableHead className="bg-card sticky top-0 z-10 shadow-sm">
                Příjemce
              </TableHead>
              <TableHead className="bg-card sticky top-0 z-10 shadow-sm">
                E-mail
              </TableHead>
              <TableHead className="bg-card sticky top-0 z-10 shadow-sm">
                Autor
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
            {certificates.map((cert) => (
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
                <TableCell>{cert.recipientEmail}</TableCell>
                <TableCell>{cert.authorName}</TableCell>
                <TableCell>
                  <div className="group flex items-center gap-2">
                    <Link
                      href={`/dashboard/admin/sablona/${cert.templateId}`}
                      className="text-muted-foreground flex items-center gap-1 font-mono text-xs"
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
                  <div className="flex justify-end gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={async () => {
                              try {
                                toast.loading("Připravuji stahování...", {
                                  id: `admin-download-${cert.id}`,
                                });
                                const data =
                                  await utils.admin.getCertificateUrl.fetch({
                                    id: cert.id,
                                  });
                                if (data.certificateUrl) {
                                  downloadFile(
                                    data.certificateUrl,
                                    `${data.validationToken}.png`,
                                  );
                                  toast.success("Stahování úspěšně zahájeno", {
                                    id: `admin-download-${cert.id}`,
                                  });
                                } else {
                                  toast.error(
                                    "Tento certifikát nemá uložený obrázek.",
                                    { id: `admin-download-${cert.id}` },
                                  );
                                }
                              } catch {
                                toast.error("Chyba při stahování.", {
                                  id: `admin-download-${cert.id}`,
                                });
                              }
                            }}
                          >
                            <Download className="text-muted-foreground size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Stáhnout certifikát</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

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
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {certificates.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Žádné certifikáty nenalezeny.
                </TableCell>
              </TableRow>
            )}
            {(hasNextPage || isFetchingNextPage) && (
              <TableRow ref={loadMoreRef}>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="text-muted-foreground mx-auto flex w-fit items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Načítám další certifikáty...
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
