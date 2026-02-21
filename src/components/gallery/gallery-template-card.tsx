import { BadgeCheck, Download, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

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
}

export function GalleryTemplateCard({ template }: { template: GalleryTemplate }) {
    return (
        <div className="group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-lg">
            {/* Náhled */}
            <div className="relative aspect-[1.414/1] w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                {template.previewImageUrl ? (
                    <Image
                        src={template.previewImageUrl}
                        alt={template.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
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
                <button
                    className={`absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all ${template.isFavorited
                        ? "bg-red-500 text-white"
                        : "bg-white/90 text-gray-400 hover:bg-white hover:text-red-500"
                        }`}
                >
                    <Heart
                        className="size-4"
                        fill={template.isFavorited ? "currentColor" : "none"}
                    />
                </button>
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col p-4">
                <h3 className="mb-1 truncate text-sm font-bold text-gray-900" title={template.name}>
                    {template.name}
                </h3>

                {/* Popis – vždy zabere výšku 2 řádků */}
                <p className="mb-3 line-clamp-2 min-h-[2.5rem] text-xs text-gray-500">
                    {template.description ?? "Bez popisu"}
                </p>

                {/* Autor + statistiky na jednom řádku */}
                <div className="mb-4 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-500">
                        {template.authorName.charAt(0).toUpperCase()}
                    </div>
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
                    className="mt-auto w-full bg-[#E65758] hover:bg-[#d44647] text-white rounded-xl"
                >
                    Použít šablonu
                    <ArrowRight className="ml-1.5 size-3.5" />
                </Button>
            </div>
        </div>
    );
}
