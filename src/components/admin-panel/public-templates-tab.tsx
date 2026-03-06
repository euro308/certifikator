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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Loader2,
  Copy,
  MoreHorizontal,
  ExternalLink,
  FileMinus,
  BookImage,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import { useDebounce } from "@/hooks/use-debounce";

export function PublicTemplatesTab() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isFetching,
  } = api.templates.getPublicTemplates.useInfiniteQuery(
    {
      limit: 20,
      search: debouncedSearchQuery || undefined,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );
  const templates = data?.pages.flatMap((page) => page.items) ?? [];
  const loadMoreRef = React.useRef<HTMLTableRowElement>(null);

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
  const utils = api.useUtils();
  const [templateToTakeDown, setTemplateToTakeDown] = React.useState<
    string | null
  >(null);
  const [takeDownReason, setTakeDownReason] = React.useState(
    "Z důvodu porušení obchodních podmínek nebo nevhodného obsahu.",
  );

  const takeDownMutation = api.admin.takeDownTemplate.useMutation({
    onSuccess: () => {
      toast.success(
        "Šablona byla stažena z galerie a uživatel byl informován.",
      );
      void utils.templates.getPublicTemplates.invalidate();
      void utils.admin.getOverviewStats.invalidate();
      setTemplateToTakeDown(null);
      setTakeDownReason("");
    },
    onError: () => {
      toast.error("Nepodařilo se stáhnout šablonu z veřejné galerie.");
    },
  });

  const confirmTakeDown = () => {
    if (!templateToTakeDown) return;
    takeDownMutation.mutate({
      templateId: templateToTakeDown,
      reason: takeDownReason,
    });
  };

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
          <p className="text-muted-foreground">Načítám veřejné šablony...</p>
        </div>
      </div>
    );
  }

  if (!templates) {
    return <div className="p-4 text-red-500">Chyba při načítání šablon.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative flex max-w-sm items-center gap-2">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="hledat dle ID, názvu nebo autora..."
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
                ID šablony
              </TableHead>
              <TableHead className="bg-card sticky top-0 z-10 shadow-sm">
                Název
              </TableHead>
              <TableHead className="bg-card sticky top-0 z-10 shadow-sm">
                Autor
              </TableHead>
              <TableHead className="bg-card sticky top-0 z-10 shadow-sm">
                Publikováno
              </TableHead>
              <TableHead className="bg-card sticky top-0 z-10 text-right shadow-sm">
                Stažení
              </TableHead>
              <TableHead className="bg-card sticky top-0 z-10 text-right shadow-sm">
                Akce
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
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
                <TableCell className="text-right font-medium">
                  {template.downloads || 0}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      side="bottom"
                      align="end"
                      className="w-56"
                    >
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/admin/sablona/${template.id}`}
                          className="flex cursor-pointer gap-2"
                        >
                          <ExternalLink className="text-muted-foreground size-4" />
                          <span>Detail šablony</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/galerie/${template.id}`}
                          className="flex cursor-pointer gap-2"
                        >
                          <BookImage className="text-muted-foreground size-4" />
                          <span>Otevřít v galerii</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex cursor-pointer gap-2 font-medium text-red-600 focus:bg-red-50 focus:text-red-700"
                        onClick={() => setTemplateToTakeDown(template.id)}
                      >
                        <FileMinus className="size-4 text-red-600" />
                        <span>Stáhnout z galerie</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {templates.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Žádné veřejné šablony nenalezeny.
                </TableCell>
              </TableRow>
            )}
            {/* Observer pro načítání dalších */}
            {(hasNextPage || isFetchingNextPage) && (
              <TableRow ref={loadMoreRef}>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex w-full items-center justify-center text-gray-500">
                    <Loader2 className="mr-2 size-6 animate-spin" />
                    <span>Načítám další šablony...</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!templateToTakeDown}
        onOpenChange={(open) => !open && setTemplateToTakeDown(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Stáhnout šablonu z veřejné galerie?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Šablona se stane soukromou a její autor obdrží informační email s
              důvodem stažení. Chtějte uvést upřesňující důvod (bude součástí
              emailu):
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              value={takeDownReason}
              onChange={(e) => setTakeDownReason(e.target.value)}
              placeholder="Důvod stažení šablony..."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTemplateToTakeDown(null)}>
              Zrušit
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmTakeDown}
              disabled={takeDownMutation.isPending || !takeDownReason.trim()}
              className="disabled:opacity-50"
            >
              {takeDownMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Stahuji
                  šablonu...
                </>
              ) : (
                "Opravdu stáhnout"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
