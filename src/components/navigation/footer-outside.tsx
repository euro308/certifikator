import Link from "next/link";

export function FooterOutside() {
  return (
    <footer className="mt-auto border-t bg-white/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-around gap-6 md:flex-row">
          {/* Left side - Branding */}
          <Link
            className="bg-gradient-primary bg-clip-text text-lg font-bold text-transparent"
            href={"/"}
          >
            Certifikátor
          </Link>

          {/* Center - Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <Link
              href="/galerie"
              className="transition-colors hover:text-[#E65758]"
            >
              Galerie šablon
            </Link>
            <Link
              href="/funkce"
              className="transition-colors hover:text-[#E65758]"
            >
              Funkce
            </Link>
            <Link
              href="/kontrola-platnosti"
              className="transition-colors hover:text-[#E65758]"
            >
              Kontrola platnosti
            </Link>
            <Link
              href="/o-projektu"
              className="transition-colors hover:text-[#E65758]"
            >
              O projektu
            </Link>
            <Link
              href="/kontakt"
              className="transition-colors hover:text-[#E65758]"
            >
              Kontakt
            </Link>
          </div>

          {/* Right side - Copyright */}
          <div className="text-sm text-gray-500">© 2025 Certifikátor.</div>
        </div>
      </div>
    </footer>
  );
}
