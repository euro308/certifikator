"use client";

import { useState } from "react";
import { Search, ArrowUp, ArrowDown } from "lucide-react";
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

const ITEMS_PER_PAGE = 16;

type SortKey = "date" | "favorites" | "downloads" | "name";
type SortDir = "asc" | "desc";

const sortFields: { key: SortKey; label: string }[] = [
    { key: "downloads", label: "Využití" },
    { key: "favorites", label: "Oblíbenost" },
    { key: "name", label: "Název" },
    { key: "date", label: "Datum" },
];

export function GalleryContent() {
    const searchParams = useSearchParams();
    const [searchValue, setSearchValue] = useState(searchParams.get("search") ?? "");
    const [sortKey, setSortKey] = useState<SortKey>("downloads");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

    const { data: allTemplates, isLoading } = api.templates.getPublicTemplates.useQuery();

    const handleSortClick = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
        } else {
            setSortKey(key);
            setSortDir(key === "name" ? "asc" : "desc");
        }
    };

    // Client-side filtering + sorting
    const filtered = (allTemplates ?? [])
        .filter((t) => {
            if (!searchValue.trim()) return true;
            const q = searchValue.toLowerCase();
            return (
                t.name.toLowerCase().includes(q) ||
                (t.description?.toLowerCase() ?? "").includes(q) ||
                t.authorName.toLowerCase().includes(q)
            );
        })
        .sort((a, b) => {
            const dir = sortDir === "desc" ? -1 : 1;
            switch (sortKey) {
                case "date":
                    return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                case "favorites":
                    return dir * (a.favoritesCount - b.favoritesCount);
                case "downloads":
                    return dir * (a.downloads - b.downloads);
                case "name":
                    return dir * a.name.localeCompare(b.name, "cs");
                default:
                    return 0;
            }
        });

    const visible = filtered.slice(0, visibleCount);
    const hasMore = visibleCount < filtered.length;

    // Loading stav – skeleton karty
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
                        <Skeleton className="aspect-[1.414/1] w-full" />
                        <div className="flex flex-1 flex-col gap-3 p-4">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                            <div className="flex items-center gap-2 mt-1">
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
        );
    }

    // Žádné veřejné šablony v DB
    if (!allTemplates || allTemplates.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white/50 py-20 text-center">
                <Search className="mb-4 size-10 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-700">
                    Zatím zde nejsou žádné šablony
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    Buďte první, kdo sdílí svou šablonu s komunitou!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Vyhledávání */}
            <div className="mx-auto max-w-xl">
                <InputGroup className="h-10">
                    <InputGroupInput
                        type="text"
                        value={searchValue}
                        placeholder="Hledat podle názvu, popisu nebo autora..."
                        onChange={(e) => {
                            setSearchValue(e.target.value);
                            setVisibleCount(ITEMS_PER_PAGE);
                        }}
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
                            className={`h-8 gap-1 rounded-lg text-xs font-medium ${isActive ? "" : "text-gray-600"
                                }`}
                            onClick={() => handleSortClick(field.key)}
                        >
                            {field.label}
                            {isActive && (
                                sortDir === "desc"
                                    ? <ArrowDown className="size-3" />
                                    : <ArrowUp className="size-3" />
                            )}
                        </Button>
                    );
                })}
            </div>

            {/* Grid šablon */}
            {visible.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {visible.map((template) => (
                        <GalleryTemplateCard key={template.id} template={template} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white/50 py-20 text-center">
                    <Search className="mb-4 size-10 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-700">
                        Žádné šablony nenalezeny
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Zkuste upravit vyhledávání.
                    </p>
                </div>
            )}

            {/* Načíst další */}
            {hasMore && (
                <div className="flex justify-center">
                    <Button
                        variant="outline"
                        size="lg"
                        className="rounded-xl px-8"
                        onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                    >
                        Načíst další šablony
                    </Button>
                </div>
            )}
        </div>
    );
}
