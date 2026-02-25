"use client";

import {
  BadgeCheck,
  Download,
  Heart,
  ArrowRight,
  Loader2,
  User,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authClient } from "@/server/better-auth/client";
import { ReportTemplateDialog } from "@/components/gallery/report-template-dialog";
import { useState } from "react";

interface GalleryTemplate {
  id: string;
  name: string;
  description: string | null;
  thumbnailImageUrl: string | null;
  downloads: number;
  createdAt: Date;
  userId: string;
  authorName: string;
  favoritesCount: number;
  isFavorited: boolean;
  isReportedByMe?: boolean;
  isOfficial: boolean;
  authorImage?: string | null;
}

export function GalleryTemplateCard({
  template,
}: {
  template: GalleryTemplate;
}) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const utils = api.useUtils();
  const isOwn = !!session?.user && session.user.id === template.userId;

  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const toggleFavorite = api.templates.toggleFavorite.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.isFavorited
          ? "Šablona přidána do oblíbených"
          : "Šablona odebrána z oblíbených",
      );
      void utils.templates.getPublicTemplates.invalidate();
    },
    onError: () => {
      toast.error("Nepodařilo se změnit oblíbené.");
    },
  });

  const handleFavoriteClick = () => {
    if (!session?.user) {
      router.push("/prihlaseni");
      return;
    }
    toggleFavorite.mutate({ templateId: template.id });
  };

  const reportTemplate = api.templates.reportTemplate.useMutation({
    onSuccess: () => {
      toast.success("Děkujeme za nahlášení. Administrátoři šablonu prověří.");
      setReportDialogOpen(false);
      void utils.templates.getPublicTemplates.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Nepodařilo se šablonu nahlásit.");
    },
  });

  const handleReportSubmit = (reason: string) => {
    if (!session?.user) {
      router.push("/prihlaseni");
      return;
    }
    reportTemplate.mutate({ templateId: template.id, reason });
  };

  const handleReportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!session?.user) {
      router.push("/prihlaseni");
      return;
    }
    setReportDialogOpen(true);
  };

  const handleUseTemplate = () => {
    if (!session?.user) {
      router.push("/prihlaseni");
      return;
    }
    router.push(`/dashboard/me-certifikaty/novy?idSablony=${template.id}`);
  };

  const initials =
    template.authorName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-lg">
      {/* Náhled – kliknutí otevře detail */}
      <Link
        href={`/galerie/${template.id}`}
        className="relative block aspect-[1.414/1] w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100"
      >
        {template.thumbnailImageUrl ? (
          <Image
            src={template.thumbnailImageUrl}
            alt={template.name}
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

        {/* Oficiální badge */}
        {template.isOfficial && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-gradient-to-r from-[#E65758] to-[#ff8a8b] px-2.5 py-1 text-xs font-semibold text-white shadow-md">
            <BadgeCheck className="size-3.5" />
            Oficiální
          </div>
        )}

        {/* Tlačítko oblíbit – plovoucí v rohu */}
        {!isOwn && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleFavoriteClick();
            }}
            disabled={toggleFavorite.isPending}
            className={`absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all disabled:opacity-60 ${
              template.isFavorited
                ? "bg-red-500 text-white"
                : "bg-white/90 text-gray-400 hover:bg-white hover:text-red-500"
            }`}
          >
            {toggleFavorite.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Heart
                className="size-4"
                fill={template.isFavorited ? "currentColor" : "none"}
              />
            )}
          </button>
        )}
      </Link>

      {/* Info */}
      <div className="relative flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <Link
            href={`/galerie/${template.id}`}
            className="block truncate text-sm font-bold text-gray-900 transition-colors hover:text-[#E65758]"
            title={template.name}
          >
            {template.name}
          </Link>

          {!isOwn && (
            <button
              onClick={handleReportClick}
              disabled={template.isReportedByMe}
              title={
                template.isReportedByMe
                  ? "Již jste nahlásil(a)"
                  : "Nahlásit nevhodnou šablonu"
              }
              className="mt-0.5 text-gray-300 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Flag
                className={`size-3.5 ${template.isReportedByMe ? "fill-red-500 text-red-500" : ""}`}
              />
            </button>
          )}
        </div>

        {/* Popis – vždy zabere výšku 2 řádků */}
        <div className="mb-3 h-[2.5rem] overflow-hidden">
          <span className="line-clamp-2 text-xs text-gray-500">
            {template.description ?? "Bez popisu"}
          </span>
        </div>

        {/* Autor + statistiky na jednom řádku */}
        <div className="mb-4 flex items-center gap-1.5">
          <Avatar className="h-5 w-5 border">
            <AvatarImage
              src={template.authorImage ?? undefined}
              alt={template.authorName}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
              {initials || <User className="size-3" />}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-xs text-gray-500">
            {template.authorName}
          </span>

          <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Download className="size-3.5" />
              {template.downloads}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="size-3.5" />
              {template.favoritesCount}
            </span>
          </div>
        </div>

        {/* Akce */}
        <Button
          size="sm"
          className={`mt-auto w-full rounded-xl ${
            isOwn
              ? "border border-[#E65758] bg-transparent text-[#E65758] hover:bg-[#E65758]/5"
              : "bg-[#E65758] text-white hover:bg-[#d44647]"
          }`}
          variant={isOwn ? "outline" : "default"}
          onClick={handleUseTemplate}
        >
          {isOwn ? "Vaše šablona" : "Použít šablonu"}
          <ArrowRight className="ml-1.5 size-3.5" />
        </Button>
      </div>

      {reportDialogOpen && (
        <ReportTemplateDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          templateName={template.name}
          isPending={reportTemplate.isPending}
          onSubmit={handleReportSubmit}
        />
      )}
    </div>
  );
}
