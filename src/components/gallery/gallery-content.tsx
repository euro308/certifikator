"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { Search, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { GalleryTemplateCard } from "@/components/gallery/gallery-template-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";

const ITEMS_PER_PAGE = 16;

type SortKey = "date" | "favorites" | "downloads" | "name";
type SortDir = "asc" | "desc";

const sortFields: { key: SortKey; label: string }[] = [
  { key: "downloads", label: "Využití" },
  { key: "favorites", label: "Oblíbenost" },
  { key: "name", label: "Název" },
  { key: "date", label: "Datum" },
];

function GalleryContentInner() {
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") ?? "",
  );

  const debouncedSearchQuery = useDebounce(searchValue, 300);

  const [sortKey, setSortKey] = useState<SortKey>("downloads");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    api.templates.getPublicTemplates.useInfiniteQuery(
      {
        limit: ITEMS_PER_PAGE,
        search: debouncedSearchQuery.trim() || undefined,
        sortBy: sortKey,
        sortDir: sortDir,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const handleSortClick = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  // Stránky v jednom poli
  const visible = data?.pages.flatMap((page) => page.items) ?? [];

  // Infinite Scroll Observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "400px" }, // Načíst trochu dříve
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Žádné veřejné šablony v DB (a zrovna se nenačítá)
  const isEmpty = visible.length === 0 && !debouncedSearchQuery && !isLoading;

  return (
    <div className="space-y-6">
      {/* Vyhledávání */}
      <div className="mx-auto max-w-xl">
        <InputGroup className="h-10">
          <InputGroupInput
            type="text"
            value={searchValue}
            placeholder="Hledat podle názvu, popisu nebo autora..."
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <InputGroupAddon>
            <Search className="size-4" />
          </InputGroupAddon>
        </InputGroup>
      </div>

      {/* Řazení */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="mr-1 text-sm text-gray-500">Řadit podle:</span>
        {sortFields.map((field) => {
          const isActive = sortKey === field.key;
          return (
            <Button
              key={field.key}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={`h-8 gap-1 rounded-lg text-xs font-medium ${
                isActive ? "" : "text-gray-600"
              }`}
              onClick={() => handleSortClick(field.key)}
            >
              {field.label}
              {isActive &&
                (sortDir === "desc" ? (
                  <ArrowDown className="size-3" />
                ) : (
                  <ArrowUp className="size-3" />
                ))}
            </Button>
          );
        })}
      </div>

      {/* Hlavní obsah (Skeletons / Grid / Empty state) */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white/50 py-20 text-center">
          <Search className="mb-4 size-10 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700">
            Zatím zde nejsou žádné šablony
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Buďte první, kdo sdílí svou šablonu s komunitou!
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm"
            >
              <Skeleton className="aspect-[1.414/1] w-full" />
              <div className="flex flex-1 flex-col gap-3 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <div className="mt-1 flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                  <div className="ml-auto flex gap-2">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                </div>
                <Skeleton className="mt-auto h-8 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : visible.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((template) => (
              <GalleryTemplateCard key={template.id} template={template} />
            ))}
          </div>

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
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white/50 py-20 text-center">
          <Search className="mb-4 size-10 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700">
            Žádné šablony nenalezeny
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Zkuste upravit vyhledávání a filtry.
          </p>
        </div>
      )}
    </div>
  );
}

export function GalleryContent() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8 text-gray-400">
          <Loader2 className="mr-2 size-6 animate-spin" />
          <span>Načítám galerii...</span>
        </div>
      }
    >
      <GalleryContentInner />
    </Suspense>
  );
}
