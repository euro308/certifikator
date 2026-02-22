import { NavbarOutside } from "@/components/navbar-outside";
import { FooterOutside } from "@/components/footer-outside";
import { GalleryContent } from "@/components/gallery/gallery-content";

export default function Galerie() {
    return (
        <main className="flex min-h-screen max-w-screen flex-col bg-gradient-to-br from-red-50 via-white to-rose-50">
            <NavbarOutside />

            <div className="flex-1 px-4 pt-28 pb-16">
                <div className="mx-auto max-w-7xl">
                    <h1 className="mb-4 text-center text-4xl font-extrabold tracking-tight md:text-5xl">
                        <span className="bg-gradient-primary bg-clip-text text-transparent">
                            Galerie šablon
                        </span>
                    </h1>
                    <p className="mx-auto mb-10 max-w-2xl text-center text-lg text-gray-600">
                        Prohlédněte si šablony vytvořené komunitou. Líbí se Vám nějaká?
                        Rovnou ji použijte nebo si ji přidejte do oblíbených.
                    </p>

                    <GalleryContent />
                </div>
            </div>

            <FooterOutside />
        </main>
    );
}
