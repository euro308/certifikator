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
import { Search, Loader2, Copy, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function AllTemplatesTab() {
  const { data: templates, isLoading } = api.admin.getAllTemplates.useQuery();
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleCopyId = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(id);
      toast.success("ID šablony zkopírováno");
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
          <p className="text-muted-foreground">
            Načítám všechny šablony v systému...
          </p>
        </div>
      </div>
    );
  }

  if (!templates) {
    return <div className="p-4 text-red-500">Chyba při načítání šablon.</div>;
  }

  const filteredTemplates = templates.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.authorName.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      t.userId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="relative flex max-w-sm items-center gap-2">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="hledat dle ID, názvu nebo autora..."
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
                ID šablony
              </TableHead>
              <TableHead className="bg-card sticky top-0 z-10 shadow-sm">
                Název
              </TableHead>
              <TableHead className="bg-card sticky top-0 z-10 shadow-sm">
                Autor
              </TableHead>
              <TableHead className="bg-card sticky top-0 z-10 shadow-sm">
                Vytvořeno
              </TableHead>
              <TableHead className="bg-card sticky top-0 z-10 shadow-sm">
                Stav publikace
              </TableHead>
              <TableHead className="bg-card sticky top-0 z-10 text-right shadow-sm">
                Stažení / Použití
              </TableHead>
              <TableHead className="bg-card sticky top-0 z-10 text-right shadow-sm">
                Akce
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemplates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>
                  <div className="group flex items-center gap-2">
                    <span
                      className="text-muted-foreground font-mono text-xs select-none"
                      title={template.id}
                    >
                      {template.id.substring(0, 8)}...
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => handleCopyId(template.id, e)}
                      title="Zkopírovat ID"
                    >
                      <Copy className="size-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>{template.authorName}</TableCell>
                <TableCell>
                  {format(new Date(template.createdAt), "dd. MM. yyyy", {
                    locale: cs,
                  })}
                </TableCell>
                <TableCell>
                  {template.isPublic ? (
                    <Badge
                      variant="outline"
                      className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50"
                    >
                      Veřejná
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-muted text-muted-foreground hover:bg-muted"
                    >
                      Soukromá
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {template.downloads || 0}
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
                            href={`/dashboard/admin/sablona/${template.id}`}
                          >
                            <ExternalLink className="text-muted-foreground size-4" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Detail šablony</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
            {filteredTemplates.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Žádné šablony nenalezeny.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
