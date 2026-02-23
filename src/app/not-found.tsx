import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NavbarOutside } from "@/components/navigation/navbar-outside";
import { FooterOutside } from "@/components/navigation/footer-outside";

export default function NotFound() {
  return (
    <main className="flex min-h-screen max-w-screen flex-col bg-gradient-to-br from-red-50 via-white to-rose-50">
      <NavbarOutside />

      <div className="flex-grow flex items-center justify-center pt-24 pb-12 px-6">
        <div className="text-center space-y-8 max-w-2xl mx-auto">
          {/* Velké 404 */}
          <h1 className="text-[10rem] md:text-[14rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-[#E65758] to-[#ff8a8b] drop-shadow-sm select-none leading-none">
            404
          </h1>

          {/* Texty */}
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Jejda! Tady nic není.
            </h2>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              Stránka, kterou hledáte, neexistuje, byla přesunuta nebo dočasně není dostupná.
            </p>
          </div>

          {/* Akce */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-[#E65758] hover:bg-[#d44647] text-white w-full sm:w-auto h-12 px-8 rounded-xl font-medium shadow-sm transition-all hover:shadow-md">
              <Link href="/">
                Zpět na hlavní stránku
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 rounded-xl font-medium border-gray-200 hover:bg-gray-50 text-gray-700 transition-all">
              <Link href="/kontakt">
                Kontaktovat podporu
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <FooterOutside />
    </main>
  );
}