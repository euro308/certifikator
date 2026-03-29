"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, EyeOff, Flag } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DeleteDialog } from "@/components/dialogs/delete-dialog";

interface GroupedReport {
  templateId: string;
  templateName: string;
  templateDescription: string | null;
  thumbnailImageUrl: string | null;
  authorName: string;
  reportCount: number;
  latestReportAt: Date;
}

export function ReportsTab() {
  const utils = api.useUtils();
  const { data, isLoading } = api.admin.getReports.useQuery();
  const reportsGrouped = data as GroupedReport[] | undefined;

  const [confirmTakeDownId, setConfirmTakeDownId] = useState<string | null>(
    null,
  );

  const takeDownTemplate = api.admin.takeDownTemplate.useMutation({
    onSuccess: () => {
      toast.success("Šablona byla skryta z veřejné galerie a reporty smazány.");
      setConfirmTakeDownId(null);
      void utils.admin.getReports.invalidate();
      void utils.admin.getAllTemplates.invalidate();
      void utils.admin.getOverviewStats.invalidate();
    },
    onError: (err) => toast.error(err.message || "Chyba při skrývání šablony."),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (!reportsGrouped || reportsGrouped.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Flag className="mb-4 h-12 w-12 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900">
            Žádná nahlášení
          </h2>
          <p className="mt-2 text-gray-500">
            Aktuálně neevidujeme žádné nevhodné šablony.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Nahlášené šablony</h2>
        <span className="text-sm text-gray-500">
          Celkem: {reportsGrouped.length}
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {reportsGrouped.map((item) => {
          const initials =
            item.authorName
              ?.split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) ?? "U";

          return (
            <div
              key={item.templateId}
              className="group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:border-red-200 hover:shadow-lg"
            >
              {/* Náhled – kliknutí otevře detail */}
              <Link
                href={`/dashboard/admin/nahlaseni/${item.templateId}`}
                className="relative block aspect-[1.414/1] w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100"
              >
                {item.thumbnailImageUrl ? (
                  <Image
                    src={item.thumbnailImageUrl}
                    alt={item.templateName}
                    fill
                    className="object-cover transition-transform group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-sm font-medium tracking-wider text-gray-300 uppercase">
                      Bez náhledu
                    </span>
                  </div>
                )}

                {/* Badge s počtem nahlášení v rohu */}
                <div className="absolute top-2 right-2 flex items-center justify-center rounded-full bg-red-500/90 px-2.5 py-1 text-xs font-bold text-white shadow-md">
                  <Flag className="mr-1 size-3.5" />
                  {item.reportCount} nahlášení
                </div>
              </Link>

              {/* Info */}
              <div className="relative flex flex-1 flex-col p-4">
                <Link
                  href={`/dashboard/admin/nahlaseni/${item.templateId}`}
                  className="mb-1 block truncate text-sm font-bold text-gray-900 transition-colors hover:text-[#E65758]"
                  title={item.templateName}
                >
                  {item.templateName}
                </Link>

                {/* Popis – vždy zabere výšku 2 řádků */}
                <div className="mb-3 h-[2.5rem] overflow-hidden">
                  <span className="line-clamp-2 text-xs text-gray-500">
                    {item.templateDescription ?? "Bez popisu"}
                  </span>
                </div>

                {/* Autor + Datum posledního reportu na jednom řádku */}
                <div className="mb-4 flex items-center gap-1.5">
                  <Avatar className="h-5 w-5 border">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-xs text-gray-500">
                    {item.authorName}
                  </span>

                  <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
                    <span>
                      {new Date(item.latestReportAt).toLocaleDateString(
                        "cs-CZ",
                      )}
                    </span>
                  </div>
                </div>

                {/* Akce */}
                <div className="mt-auto flex">
                  <Button
                    size="sm"
                    className="flex-1 rounded-xl"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setConfirmTakeDownId(item.templateId);
                    }}
                  >
                    <EyeOff className="mr-1.5 size-3.5" />
                    Skrýt
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialog pro stažení šablony */}
      <DeleteDialog
        type="take-down-template"
        open={!!confirmTakeDownId}
        onOpenChange={(v) => !v && setConfirmTakeDownId(null)}
        onCancel={() => setConfirmTakeDownId(null)}
        onConfirm={(reason) => {
          if (confirmTakeDownId && reason) {
            takeDownTemplate.mutate({
              templateId: confirmTakeDownId,
              reason: reason,
            });
          }
        }}
        isDeleting={takeDownTemplate.isPending}
      />
    </div>
  );
}
