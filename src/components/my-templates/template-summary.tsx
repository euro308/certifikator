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
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
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
          <div className="items-between mb-6 flex w-full justify-between pr-5 pl-5">
            <InputGroup className="h-12 w-[55vw]">
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

            <div className="flex items-center gap-2">
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
              {/* Header */}
              <div className="bg-background sticky top-0 z-10 grid grid-cols-[48px_100px_1fr_1.5fr_100px_80px_40px] items-center gap-4 border-b px-5 py-3 text-sm text-muted-foreground">
                <div /> {/* Místo pro náhled */}
                <span className="text-left">ID šablony</span>
                <span
                  className={`text-left ${
                    selectedSort === "nameAToZ" || selectedSort === "nameZToA"
                      ? "text-foreground font-bold"
                      : ""
                  }`}
                >
                  Název
                </span>
                <span className="text-left">Popis</span>
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
                <div /> {/* Místo pro akce */}
              </div>

              {/* Rows */}
              <div className="flex flex-col">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="hover:bg-muted/30 grid grid-cols-[48px_100px_1fr_1.5fr_100px_80px_40px] items-center gap-4 border-b px-5 py-4 text-left transition-colors last:border-0"
                  >
                    <div className="bg-muted relative h-12 w-12 flex-shrink-0 overflow-hidden rounded border">
                      {template.previewImageUrl ? (
                        <Img
                          alt={template.name}
                          src={template.previewImageUrl}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-muted-foreground flex h-full items-center justify-center p-1 text-center text-[10px] leading-tight uppercase">
                          Bez náhledu
                        </div>
                      )}
                    </div>
                    <span
                      className="text-muted-foreground truncate font-mono text-[10px]"
                      title={template.id}
                    >
                      {template.id}
                    </span>
                    <span className="truncate font-medium">
                      {template.name}
                    </span>
                    <span className="text-muted-foreground truncate text-sm">
                      {template.description || "-"}
                    </span>
                    <span className="text-sm">
                      {new Date(template.createdAt).toLocaleDateString("cs-CZ")}
                    </span>
                    <div className="text-sm">
                      <TemplateUsageCounter templateId={template.id} />
                    </div>
                    <div className="flex justify-end">
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
                        <DropdownMenuContent side="bottom" align="end">
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