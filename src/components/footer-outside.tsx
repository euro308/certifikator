import Link from "next/link";

export function FooterOutside() {
  return (
    <footer className="border-t bg-white/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-around gap-6 max-w-6xl mx-auto">
          {/* Left side - Branding */}
          <Link className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent" href={"/"}>
            Certifikátor
          </Link>

          {/* Center - Links */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/funkce" className="hover:text-[#E65758] transition-colors">
              Funkce
            </Link>
            <Link href="/o-projektu" className="hover:text-[#E65758] transition-colors">
              O projektu
            </Link>
            <Link href="/galerie" className="hover:text-[#E65758] transition-colors">
              Galerie
            </Link>
            <Link href="/kontrola-platnosti" className="hover:text-[#E65758] transition-colors">
              Kontrola platnosti
            </Link>
            <Link href="/kontakt" className="hover:text-[#E65758] transition-colors">
              Kontakt
            </Link>
          </div>

          {/* Right side - Copyright */}
          <div className="text-sm text-gray-500">
            © 2025 Certifikátor.
          </div>
        </div>
      </div>
    </footer>
  )
}