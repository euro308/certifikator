import Link from "next/link";
import { Button } from "@/components/ui/button"
import { HydrateClient } from "@/trpc/server";
import { NavbarOutside } from "@/components/navbar-outside";
import { FooterOutside } from "@/components/footer-outside";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col bg-gradient-to-br from-red-50 via-white to-rose-50">
        {/* Landing Page Navbar */}
        <NavbarOutside/>
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center flex-1 px-6 pt-32 pb-16">
          <header className="text-center max-w-4xl mx-auto space-y-6">
            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Certifikátor
              </span>
            </h1>

            {/* Subheading */}
            <h2 className="text-xl md:text-2xl lg:text-3xl text-gray-600 font-medium leading-relaxed max-w-3xl mx-auto">
              Jednotné prostředí pro tvorbu, správu, rozeslání a validaci certifikátů!
            </h2>

            {/* Description */}
            <p className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto">
              Vytvářejte profesionální certifikáty s vlastním designem, spravujte šablony,
              automaticky rozesílejte držitelům a ověřujte jejich pravost.
            </p>
          </header>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <Button
              size="lg"
              className="bg-gradient-primary hover:opacity-90 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Link href={"/registrace"}>
                Registrovat se
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-2 border-[#E65758] text-[#E65758] hover:bg-red-50 px-8 py-6 text-lg font-semibold transition-all duration-200"
            >
              <Link href={"/prihlaseni"}>
                Přihlásit se
              </Link>
            </Button>
          </div>
        </section>

        {/* Features Preview Section */}
        <section className="container mx-auto px-6 py-12 pb-20">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#E65758]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Vlastní design</h3>
              <p className="text-gray-600">Vytvářejte certifikáty podle svých představ s intuitivním editorem</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#A64858]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Automatické rozesílání</h3>
              <p className="text-gray-600">Import z Excelu a hromadné rozeslání certifikátů emailem</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#771D32]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Validace pravosti</h3>
              <p className="text-gray-600">Každý certifikát má unikátní kód pro ověření autenticity</p>
            </div>
          </div>
        </section>

        {/* FooterOutside */}
        <FooterOutside/>
      </main>
    </HydrateClient>
  );
}
