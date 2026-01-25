"use client";

import { useState } from "react";
import { PencilLine, Plus, Search, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
import { Img } from "@react-email/img";
import { api } from "@/trpc/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

interface TemplateSummaryProps {
  userTemplates: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    description: string | null;
    categoryId: string;
    canvasData: unknown;
    placeholders: unknown;
    previewImageUrl: string | null;
    isPublic: boolean;
    isVerified: boolean;
    downloads: number;
    deletedAt: Date | null;
  }[];
}

const TemplateUsageCounter = ({ templateId }: { templateId: string }) => {
  // Použijeme tRPC hook pro načtení dat
  const { data: count, isLoading } =
    api.certificates.getCertificateCountByTemplate.useQuery({
      templateId,
    });

  if (isLoading) return <span className="text-muted-foreground">...</span>;

  return <span>{count ?? 0}x</span>;
};

export function TemplateSummary({ userTemplates }: TemplateSummaryProps) {
  const [searchValue, setSearchValue] = useState<string>("");
  const [selectedSort, setSelectedSort] = useState<string>("nameAToZ");
  const router = useRouter();

  const filteredTemplates = userTemplates
    .filter(
      (template) =>
        template.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        template.id.toLowerCase().includes(searchValue.toLowerCase()) ||
        (template.description?.toLowerCase() ?? "").includes(
          searchValue.toLowerCase(),
        ),
    )
    .sort((a, b) => {
      switch (selectedSort) {
        case "nameAToZ":
          return a.name.localeCompare(b.name);
        case "nameZToA":
          return b.name.localeCompare(a.name);
        case "creationDateNewest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "creationDateOldest":
          return (
            new Date(a.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

  const sortBy = [
    { label: "Název šablony: A až Z", value: "nameAToZ" },
    { label: "Název šablony: Z až A", value: "nameZToA" },
    { label: "Datum vytvoření: nejnovější", value: "creationDateNewest" },
    { label: "Datum vytvoření: nejstarší", value: "creationDateOldest" },
    { label: "Počet využití: sestupně", value: "usedCountMost" },
    { label: "Počet využití: vzestupně", value: "usedCountLeast" },
  ];

  return (
    <>
      {userTemplates.length === 0 ? (
        <div className="flex h-[75vh] min-h-full flex-col items-center justify-center rounded-lg border border-dashed text-center">
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
        <div className="flex h-[75vh] min-h-full flex-col items-center rounded-lg border border-dashed pt-5 text-center">
          {/* NAVIGACE - SEARCH A SEŘAZENÍ */}
          <div className="mb-6 flex w-full flex-col gap-4 px-5 md:flex-row md:items-center md:justify-between">
            <InputGroup className="h-12 w-full md:w-[400px] lg:w-[40vw]">
              <InputGroupInput
                type="text"
                value={searchValue}
                placeholder="Vyhledat šablonu"
                onChange={(e) => setSearchValue(e.target.value)}
              />
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
            </InputGroup>

            <div className="flex items-center justify-between gap-2 md:justify-end">
              <span className="text-sm text-muted-foreground">
                Seřadit podle:
              </span>
              <Select value={selectedSort} onValueChange={setSelectedSort}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {sortBy.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* LIST ŠABLON (Scrollable container with sticky header) */}
          <div className="flex w-full flex-1 flex-col overflow-hidden px-5 pb-5">
            <div className="flex-1 overflow-y-auto rounded-md border">
              {/* Header - Hidden on Mobile */}
              {/* Desktop grid layout: [Image, Name, Description, Created, Used, ID, Actions] */}
              <div className="bg-background sticky top-0 z-10 hidden items-center gap-4 border-b px-5 py-3 text-sm text-muted-foreground md:grid md:grid-cols-[70px_1fr_100px_80px_40px] lg:grid-cols-[70px_1fr_1.5fr_100px_80px_100px_40px]">
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
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="hover:bg-muted/30 grid grid-cols-[70px_1fr_40px] items-center gap-4 border-b px-5 py-2 text-left transition-colors last:border-0 md:grid-cols-[70px_1fr_100px_80px_40px] lg:grid-cols-[70px_1fr_1.5fr_100px_80px_100px_40px]"
                  >
                    {/* 1. Preview Image */}
                    <div className="bg-muted relative aspect-[1.414/1] w-[70px] flex-shrink-0 overflow-hidden rounded border shadow-sm">
                      {template.previewImageUrl ? (
                        <Img
                          alt={template.name}
                          src={template.previewImageUrl}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-muted-foreground flex h-full items-center justify-center p-1 text-center text-[10px] leading-tight uppercase cursor-default">
                          Bez náhledu
                        </div>
                      )}
                    </div>

                    {/* 2. Name (All) + Mobile Meta */}
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <span
                        className={`truncate ${
                          selectedSort === "nameAToZ" ||
                          selectedSort === "nameZToA"
                            ? "text-foreground font-medium"
                            : "text-muted-foreground font-light"
                        }`}
                        title={template.name}
                      >
                        {template.name}
                      </span>
                      {/* Mobile Meta Info */}
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground md:hidden">
                        <span>
                          {new Date(template.createdAt).toLocaleDateString(
                            "cs-CZ",
                          )}
                        </span>
                        <div className="flex items-center gap-1">
                          <TemplateUsageCounter templateId={template.id} />
                        </div>
                      </div>
                    </div>

                    {/* 3. Description (LG only) */}
                    <span className="hidden truncate text-sm text-muted-foreground lg:block">
                      {template.description ?? "-"}
                    </span>

                    {/* 4. Date (MD+) */}
                    <span
                      className={`hidden text-sm md:block ${
                        selectedSort === "creationDateNewest" ||
                        selectedSort === "creationDateOldest"
                          ? "text-foreground font-bold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {new Date(template.createdAt).toLocaleDateString("cs-CZ")}
                    </span>

                    {/* 5. Usage (MD+) */}
                    <div
                      className={`hidden text-sm md:block ${
                        selectedSort === "usedCountMost" ||
                        selectedSort === "usedCountLeast"
                          ? "text-foreground font-bold"
                          : "text-muted-foreground"
                      }`}
                    >
                      <TemplateUsageCounter templateId={template.id} />
                    </div>

                    {/* 6. ID (LG only) - Moved to end */}
                    <span
                      className="hidden truncate font-mono text-[10px] text-muted-foreground lg:block"
                      title={template.id}
                    >
                      {template.id}
                    </span>

                    {/* 7. Actions (All) */}
                    <div
                      className="flex justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            ...
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="bottom" align="start">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/me-sablony/${template.id}`}
                              className="flex cursor-pointer gap-2"
                            >
                              <PencilLine className="size-4" />
                              <span>Upravit šablonu</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex cursor-pointer gap-2 text-red-600 focus:bg-red-50 focus:text-red-600">
                            <Trash className="size-4" />
                            <span>Smazat šablonu</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}