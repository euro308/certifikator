"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Copy,
  Heart,
  Loader2,
  MoreHorizontal,
  PencilLine,
  Plus,
  Search,
  Trash,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/dialogs/delete-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDebounce } from "@/hooks/use-debounce";

interface UserTemplate {
  id: string;
  name: string;
  description: string | null;
  thumbnailImageUrl: string | null;
  placeholders: unknown;
  createdAt: Date;
}

interface FavoriteTemplate {
  favoriteId: string;
  templateId: string;
  templateName: string;
  templateDescription: string | null;
  thumbnailImageUrl: string | null;
  authorName: string;
  downloads: number;
  isOfficial: boolean;
  favoritedAt: Date;
}

type TemplateRow =
  | { type: "own"; data: UserTemplate }
  | { type: "gallery"; data: FavoriteTemplate };

const TemplateUsageCounter = ({ templateId }: { templateId: string }) => {
  // tRPC hook pro načtení dat
  const { data: count, isLoading } =
    api.certificates.getCertificateCountByTemplate.useQuery({
      templateId,
    });

  if (isLoading) return <span className="text-muted-foreground">...</span>;

  return <span>{count ?? 0}x</span>;
};

export function TemplateSummary() {
  const [searchValue, setSearchValue] = useState<string>("");
  const debouncedSearchQuery = useDebounce(searchValue, 300);

  const [selectedSort, setSelectedSort] = useState<string>("nameAToZ");

  let sortBy: "name" | "date" = "date";
  let sortDir: "asc" | "desc" = "desc";
  if (selectedSort === "nameAToZ") {
    sortBy = "name";
    sortDir = "asc";
  }
  if (selectedSort === "nameZToA") {
    sortBy = "name";
    sortDir = "desc";
  }
  if (selectedSort === "creationDateOldest") {
    sortBy = "date";
    sortDir = "asc";
  }

  const {
    data,
    isLoading: isInitialLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isFetching,
  } = api.templates.getUserTemplates.useInfiniteQuery(
    {
      limit: 20,
      search: debouncedSearchQuery || undefined,
      sortBy,
      sortDir,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const isLoading = isInitialLoading && !data;

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState<string>("");
  const utils = api.useUtils();
  const router = useRouter();
  const hideTemplateMutation = api.templates.hideTemplate.useMutation();

  const removeFavorite = api.templates.toggleFavorite.useMutation({
    onSuccess: () => {
      toast.success("Šablona odebrána z oblíbených");
      void utils.templates.getUserTemplates.invalidate();
      void utils.templates.getPublicTemplates.invalidate();
    },
    onError: () => {
      toast.error("Nepodařilo se odebrat šablonu.");
    },
  });

  const hideTemplateFromUser = (templateId: string) => {
    hideTemplateMutation.mutate(
      {
        id: templateId,
      },
      {
        onSuccess: (_data) => {
          setDeleteDialog(false);
          toast.loading("Šablona se maže...");

          void utils.templates.getUserTemplates.invalidate().then(() => {
            toast.dismiss();
            toast.success("Šablona byla úspěšně smazána");
            setCurrentTemplateId("");
          });
        },
        onError: (err) => {
          console.log(err);
          toast.error("Chyba při mazání šablony");
        },
      },
    );
  };

  const handleCopyId = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Zabrání prokliku na detail šablony
    await navigator.clipboard.writeText(id);
    toast.success("ID šablony zkopírováno");
  };

  // Unifikovaný seznam řádků
  const ownRows: TemplateRow[] = (
    data?.pages.flatMap((p) => p.ownTemplates) ?? []
  ).map((t) => ({
    type: "own" as const,
    data: t,
  }));
  const favRows: TemplateRow[] = (
    data?.pages.flatMap((p) => p.favTemplates) ?? []
  ).map((f) => ({
    type: "gallery" as const,
    data: {
      favoriteId: f.favoriteId,
      templateId: f.id,
      templateName: f.name,
      templateDescription: f.description,
      thumbnailImageUrl: f.thumbnailImageUrl,
      authorName: f.authorName,
      downloads: f.downloads,
      isOfficial: f.isOfficial,
      favoritedAt: f.favoritedAt,
    },
  }));

  const getRowName = (row: TemplateRow) =>
    row.type === "own" ? row.data.name : row.data.templateName;
  const getRowDescription = (row: TemplateRow) =>
    row.type === "own" ? row.data.description : `od ${row.data.authorName}`;
  const getRowId = (row: TemplateRow) =>
    row.type === "own" ? row.data.id : row.data.templateId;
  const getRowThumbnail = (row: TemplateRow) =>
    row.type === "own"
      ? row.data.thumbnailImageUrl
      : row.data.thumbnailImageUrl;
  const getRowDate = (row: TemplateRow) =>
    row.type === "own" ? row.data.createdAt : row.data.favoritedAt;

  const filteredTemplates = [...ownRows, ...favRows]
    .filter((row) => {
      const date = new Date(getRowDate(row)).toLocaleDateString("cs-CZ");
      if (searchValue.length > 0 && date.includes(searchValue)) {
        return true;
      }
      return true; // Zbytek na serveru
    })
    .sort((a, b) => {
      const nameA = getRowName(a);
      const nameB = getRowName(b);
      const dateA = new Date(getRowDate(a)).getTime();
      const dateB = new Date(getRowDate(b)).getTime();
      switch (selectedSort) {
        case "nameAToZ":
          return nameA.localeCompare(nameB);
        case "nameZToA":
          return nameB.localeCompare(nameA);
        case "creationDateNewest":
          return dateB - dateA;
        case "creationDateOldest":
          return dateA - dateB;
        default:
          return 0;
      }
    });

  const sortByOptions = [
    { label: "Název šablony: A až Z", value: "nameAToZ" },
    { label: "Název šablony: Z až A", value: "nameZToA" },
    { label: "Datum vytvoření: nejnovější", value: "creationDateNewest" },
    { label: "Datum vytvoření: nejstarší", value: "creationDateOldest" },
  ];

  return (
    <div className="flex h-[75vh] min-h-full flex-col items-center rounded-lg border border-dashed pt-5 text-center">
      {/* Navigace - search a seřazení */}
      <div className="mb-6 flex w-full flex-col gap-4 px-5 md:flex-row md:items-center md:justify-between">
        <InputGroup className="h-12 w-full md:w-[400px] lg:w-[40vw]">
          <InputGroupInput
            type="text"
            value={searchValue}
            placeholder="Vyhledat šablonu podle jejího jména, ID, popisu, data vytvoření, ..."
            onChange={(e) => setSearchValue(e.target.value)}
            disabled={isFetching}
          />
          <InputGroupAddon>
            <Search className="size-4" />
          </InputGroupAddon>
        </InputGroup>

        <div className="flex items-center justify-between gap-2 md:justify-end">
          <span className="text-muted-foreground text-sm">Seřadit podle:</span>
          <Select
            value={selectedSort}
            onValueChange={setSelectedSort}
            disabled={isFetching}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {sortByOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex w-full flex-1 items-center justify-center">
          <span className="text-muted-foreground">Načítám šablony...</span>
        </div>
      ) : ownRows.length === 0 && favRows.length === 0 && !searchValue ? (
        <div className="flex w-full flex-1 flex-col items-center justify-center px-5 pb-5 text-center">
          <div className="bg-secondary mx-auto flex h-12 w-12 items-center justify-center rounded-full">
            <Plus className="size-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Zatím žádné šablony</h3>
          <p className="text-muted-foreground mt-2 mb-4 text-sm">
            Zatím jste nevytvořili žádnou šablonu. Začněte tou první!
          </p>
          <Button asChild>
            <Link href="/dashboard/me-sablony/nova">Vytvořit šablonu</Link>
          </Button>
        </div>
      ) : (
        <div className="flex w-full flex-1 flex-col overflow-hidden px-5 pb-5">
          <div className="flex-1 overflow-y-auto rounded-md border">
            {/* Header - na mobilu schovaný */}
            {/* Desktop grid layout: [Obrázek, Jméno, Popis, Vytvoření, Použito, ID, Akce] */}
            <div className="bg-background text-muted-foreground sticky top-0 z-10 hidden items-center gap-4 border-b px-5 py-3 text-sm md:grid md:grid-cols-[70px_1fr_100px_80px_40px] lg:grid-cols-[70px_1fr_1.5fr_100px_80px_100px_40px]">
              <div /> {/* Místo pro náhled */}
              <span
                className={`text-left ${
                  selectedSort === "nameAToZ" || selectedSort === "nameZToA"
                    ? "text-foreground font-bold"
                    : ""
                }`}
              >
                Název
              </span>
              <span className="hidden text-left lg:block">Popis</span>
              <span
                className={`text-left ${
                  selectedSort === "creationDateNewest" ||
                  selectedSort === "creationDateOldest"
                    ? "text-foreground font-bold"
                    : ""
                }`}
              >
                Vytvořeno
              </span>
              <span
                className={`text-left ${
                  selectedSort === "usedCountMost" ||
                  selectedSort === "usedCountLeast"
                    ? "text-foreground font-bold"
                    : ""
                }`}
              >
                Využito
              </span>
              <span className="hidden text-left lg:block">ID šablony</span>
              <div /> {/* Místo pro akce */}
            </div>

            {/* Rows */}
            <div className="flex flex-col">
              {filteredTemplates.map((row) => {
                const rowId = getRowId(row);
                const rowName = getRowName(row);
                const rowDesc = getRowDescription(row);
                const rowPreview = getRowThumbnail(row);
                const rowDate = getRowDate(row);
                const isGallery = row.type === "gallery";

                return (
                  <div
                    key={isGallery ? `fav-${rowId}` : rowId}
                    className="hover:bg-muted/30 grid grid-cols-[70px_1fr_40px] items-center gap-4 border-b px-5 py-2 text-left transition-colors last:border-0 md:grid-cols-[70px_1fr_100px_80px_40px] lg:grid-cols-[70px_1fr_1.5fr_100px_80px_100px_40px]"
                  >
                    {/* 1. Preview obrázek */}
                    <div className="bg-muted relative aspect-[1.414/1] w-[70px] flex-shrink-0 overflow-hidden rounded border shadow-sm">
                      {rowPreview ? (
                        <Image
                          alt={rowName}
                          src={rowPreview}
                          className="object-cover"
                          fill
                          sizes="70px"
                        />
                      ) : (
                        <div className="text-muted-foreground flex h-full cursor-default items-center justify-center p-1 text-center text-[10px] leading-tight uppercase">
                          Bez náhledu
                        </div>
                      )}
                    </div>

                    {/* 2. Jméno + mobile meta + gallery badge */}
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        {isGallery && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Heart
                                  className="size-3.5"
                                  color={"#fb2c36"}
                                  fill={"#fb2c36"}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>Vaše oblíbená šablona z galerie</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <Link
                          href={
                            isGallery
                              ? `/galerie/${rowId}`
                              : `/dashboard/me-sablony/${rowId}`
                          }
                        >
                          <span className="cursor-pointer truncate">
                            {rowName}
                          </span>
                        </Link>
                      </div>
                      {/* Mobile meta info */}
                      <div className="text-muted-foreground flex flex-col gap-0.5 text-xs md:hidden">
                        {isGallery && (
                          <span className="text-[10px] font-medium text-red-500">
                            Z galerie
                          </span>
                        )}
                        <span>
                          {new Date(rowDate).toLocaleDateString("cs-CZ")}
                        </span>
                        {!isGallery && (
                          <div className="flex items-center gap-1">
                            <TemplateUsageCounter templateId={rowId} />
                          </div>
                        )}
                        {isGallery && (
                          <div className="flex items-center gap-1">
                            <TemplateUsageCounter templateId={rowId} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3. Popis (LG only) */}
                    <span className="hidden truncate text-sm lg:block">
                      {rowDesc ?? "-"}
                    </span>

                    {/* 4. Datum (MD+) */}
                    <span className={"hidden text-sm md:block"}>
                      {new Date(rowDate).toLocaleDateString("cs-CZ")}
                    </span>

                    {/* 5. Využito (MD+) */}
                    <div className={"hidden text-sm md:block"}>
                      <TemplateUsageCounter templateId={rowId} />
                    </div>

                    {/* 6. ID (LG only) */}
                    <div className="group hidden items-center gap-2 lg:flex">
                      <span
                        className="text-muted-foreground truncate font-mono text-[10px] select-none"
                        title={rowId}
                      >
                        {rowId.substring(0, 8)}...
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => handleCopyId(rowId, e)}
                        title="Zkopírovat ID"
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>

                    {/* 7. Akce (All) */}
                    <div
                      className="flex justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isGallery ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="bottom" align="start">
                            <DropdownMenuItem
                              className="flex cursor-pointer gap-2"
                              onClick={() =>
                                router.push(
                                  `/dashboard/me-certifikaty/novy?idSablony=${rowId}`,
                                )
                              }
                            >
                              <ArrowRight className="size-4" />
                              <span>Použít šablonu</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex cursor-pointer gap-2 text-red-600 focus:bg-red-50 focus:text-red-600"
                              disabled={removeFavorite.isPending}
                              onClick={() =>
                                removeFavorite.mutate({ templateId: rowId })
                              }
                            >
                              {removeFavorite.isPending ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trash className="size-4" color="#e7000b" />
                              )}
                              <span>Odebrat z oblíbených</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="bottom" align="start">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/me-sablony/${rowId}/upravit?returnToList=true`}
                                className="flex cursor-pointer gap-2"
                              >
                                <PencilLine className="size-4" />
                                <span>Upravit šablonu</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex cursor-pointer gap-2 text-red-600 focus:bg-red-50 focus:text-red-600"
                              onClick={() => {
                                setDeleteDialog(true);
                                setCurrentTemplateId(rowId);
                              }}
                            >
                              <Trash className="size-4" color="#e7000b" />
                              <span>Smazat šablonu</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredTemplates.length === 0 && searchValue && (
                <div className="text-muted-foreground p-8 text-center">
                  Žádná šablona neodpovídá vašemu vyhledávání.
                </div>
              )}

              {/* Sentry pro načítání dalších */}
              {(hasNextPage || isFetchingNextPage) && (
                <div
                  ref={loadMoreRef}
                  className="flex w-full items-center justify-center py-8 text-gray-500"
                >
                  <Loader2 className="mr-2 size-6 animate-spin" />
                  <span>Načítám další šablony...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <DeleteDialog
        type={"template"}
        open={deleteDialog}
        onOpenChange={() => setDeleteDialog(!deleteDialog)}
        onConfirm={() => hideTemplateFromUser(currentTemplateId)}
        onCancel={() => setCurrentTemplateId("")}
        isDeleting={hideTemplateMutation.isPending}
      />
    </div>
  );
}
