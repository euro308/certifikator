"use client";

import { BadgeCheck, Download, Heart, ArrowRight, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authClient } from "@/server/better-auth/client";

interface GalleryTemplate {
    id: string;
    name: string;
    description: string | null;
    previewImageUrl: string | null;
    downloads: number;
    isVerified: boolean;
    createdAt: Date;
    userId: string;
    authorName: string;
    favoritesCount: number;
    isFavorited: boolean;
    isOfficial: boolean;
    authorImage?: string | null;
}

export function GalleryTemplateCard({ template }: { template: GalleryTemplate }) {
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const utils = api.useUtils();
    const isOwn = !!session?.user && session.user.id === template.userId;
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

    const handleUseTemplate = () => {
        if (!session?.user) {
            router.push("/prihlaseni");
            return;
        }
        router.push(`/dashboard/me-certifikaty/novy?idSablony=${template.id}`);
    };

    const initials = template.authorName
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

    return (
        <div className="group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-lg">
            {/* Náhled – kliknutí otevře detail */}
            <Link href={`/galerie/${template.id}`} className="relative block aspect-[1.414/1] w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                {template.previewImageUrl ? (
                    <Image
                        src={template.previewImageUrl}
                        alt={template.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-[1.02]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <span className="text-sm font-medium text-gray-300 uppercase tracking-wider">
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
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleFavoriteClick(); }}
                        disabled={toggleFavorite.isPending}
                        className={`absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all disabled:opacity-60 ${template.isFavorited
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
            <div className="flex flex-1 flex-col p-4">
                <Link href={`/galerie/${template.id}`} className="mb-1 block truncate text-sm font-bold text-gray-900 hover:text-[#E65758] transition-colors" title={template.name}>
                    {template.name}
                </Link>

                {/* Popis – vždy zabere výšku 2 řádků */}
                <div className="mb-3 h-[2.5rem] overflow-hidden">
                    <span className="line-clamp-2 text-xs text-gray-500">
                        {template.description ?? "Bez popisu"}
                    </span>
                </div>

                {/* Autor + statistiky na jednom řádku */}
                <div className="mb-4 flex items-center gap-1.5">
                    <Avatar className="h-5 w-5 border">
                        <AvatarImage src={template.authorImage ?? undefined} alt={template.authorName} className="object-cover" />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                            {initials || <User className="size-3" />}
                        </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-xs text-gray-500">{template.authorName}</span>

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
                    className={`mt-auto w-full rounded-xl ${isOwn
                        ? "border border-[#E65758] bg-transparent text-[#E65758] hover:bg-[#E65758]/5"
                        : "bg-[#E65758] hover:bg-[#d44647] text-white"
                        }`}
                    variant={isOwn ? "outline" : "default"}
                    onClick={handleUseTemplate}
                >
                    {isOwn ? "Vaše šablona" : "Použít šablonu"}
                    <ArrowRight className="ml-1.5 size-3.5" />
                </Button>
            </div>
        </div>
    );
}
