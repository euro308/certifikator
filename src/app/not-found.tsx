import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NavbarOutside } from "@/components/navigation/navbar-outside";
import { FooterOutside } from "@/components/navigation/footer-outside";

export default function NotFound() {
  return (
    <main className="flex min-h-screen max-w-screen flex-col bg-gradient-to-br from-red-50 via-white to-rose-50">
      <NavbarOutside />

      <div className="flex flex-grow items-center justify-center px-6 pt-24 pb-12">
        <div className="mx-auto max-w-2xl space-y-8 text-center">
          {/* Velké 404 */}
          <h1 className="bg-gradient-to-br from-[#E65758] to-[#ff8a8b] bg-clip-text text-[10rem] leading-none font-black text-transparent drop-shadow-sm select-none md:text-[14rem]">
            404
          </h1>

          {/* Texty */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              Jejda! Tady nic není.
            </h2>
            <p className="mx-auto max-w-md text-lg text-gray-600">
              Stránka, kterou hledáte, neexistuje, byla přesunuta nebo dočasně
              není dostupná.
            </p>
          </div>

          {/* Akce */}
          <div className="flex flex-col items-center justify-center gap-4 pt-8 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-xl bg-[#E65758] px-8 font-medium text-white shadow-sm transition-all hover:bg-[#d44647] hover:shadow-md sm:w-auto"
            >
              <Link href="/">Zpět na hlavní stránku</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 w-full rounded-xl border-gray-200 px-8 font-medium text-gray-700 transition-all hover:bg-gray-50 sm:w-auto"
            >
              <Link href="/kontakt">Kontaktovat podporu</Link>
            </Button>
          </div>
        </div>
      </div>

      <FooterOutside />
    </main>
  );
}
