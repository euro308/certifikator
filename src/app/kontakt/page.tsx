import { NavbarOutside } from "@/components/navigation/navbar-outside";
import { FooterOutside } from "@/components/navigation/footer-outside";
import { Mail } from "lucide-react";

export default function Kontakt() {
    return (
        <main className="flex min-h-screen max-w-screen flex-col bg-gradient-to-br from-red-50 via-white to-rose-50">
            <NavbarOutside />

            <div className="flex-1 px-4 pt-28 pb-16">
                <div className="mx-auto max-w-3xl">
                    <h1 className="mb-10 text-center text-4xl font-extrabold tracking-tight md:text-5xl">
                        <span className="bg-gradient-primary bg-clip-text text-transparent">
                            Kontakt
                        </span>
                    </h1>

                    <div className="mx-auto max-w-xl rounded-2xl bg-white/80 p-8 text-center shadow-lg md:p-10">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                            <Mail className="size-8 text-[#E65758]" />
                        </div>

                        <p className="mb-6 text-lg text-gray-700">
                            Máte dotaz, nápad na vylepšení nebo chcete nahlásit chybu?
                            Neváhejte nás kontaktovat na&nbsp;e-mailu:
                        </p>

                        <a
                            href="mailto:info@certifikator.eu"
                            className="inline-flex items-center gap-2 text-xl font-semibold text-[#E65758] underline underline-offset-4 transition-colors hover:text-[#c94849]"
                        >
                            <Mail className="size-5" />
                            info@certifikator.eu
                        </a>

                        <p className="mt-6 text-sm text-gray-500">
                            Odpovíme Vám co nejdříve.
                        </p>
                    </div>
                </div>
            </div>

            <FooterOutside />
        </main>
    );
}