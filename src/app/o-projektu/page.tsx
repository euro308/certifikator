import { NavbarOutside } from "@/components/navbar-outside";
import { FooterOutside } from "@/components/footer-outside";
import Link from "next/link";

export default function InfoOProjektu() {
  return (
    <main className="flex min-h-screen w-screen flex-col bg-gradient-to-br from-red-50 via-white to-rose-50">
      <NavbarOutside />

      <div className="flex-1 px-4 pt-28 pb-16">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-10 text-center text-3xl font-extrabold tracking-tight md:text-4xl">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              O projektu Certifikátor
            </span>
          </h1>

          <div className="flex flex-col gap-6 text-lg">
            <span className="text-justify text-gray-700">
              Webové prostředí Certifikátor vytváří jediný autor – student
              čtvrtého ročníku střední školy Adam. Projekt slouží jako jeho
              maturitní práce a zároveň jako praktický nástroj, který má
              usnadnit práci při tvorbě certifikátů.
            </span>

            <span className="text-justify text-gray-700">
              Impulzem ke vzniku aplikace byla zkušenost z praxe. Adamova
              maminka ve své práci často připravuje desítky až stovky
              certifikátů a ruční přepisování jmen či dalších údajů u každého
              dokumentu zvlášť je časově náročné a náchylné k chybám. Požádala
              proto Adama, zda by nebylo možné vytvořit nástroj, který část
              práce zautomatizuje. Z nápadu na pomoc v rodině tak vznikl
              maturitní projekt, který spojuje školní zadání s reálným využitím.
            </span>

            <span className="text-justify text-gray-700">
              Certifikátor je postaven na frameworku{" "}
              <a
                href={"https://nextjs.org/"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ED765E] underline underline-offset-4"
              >
                Next.js
              </a>{" "}
              a knihovně{" "}
              <a
                href={"https://react.dev/"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ED765E] underline underline-offset-4"
              >
                React
              </a>
              , používá moderní přihlašovací systém{" "}
              <a
                href={"https://www.better-auth.com/"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ED765E] underline underline-offset-4"
              >
                Better Auth
              </a>
              , canvasové prostředí{" "}
              <a
                href={"https://konvajs.org/"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ED765E] underline underline-offset-4"
              >
                Konva
              </a>{" "}
              pro tvorbu šablon, knihovnu{" "}
              <a
                href={"https://sheetjs.com/"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ED765E] underline underline-offset-4"
              >
                SheetJS
              </a>{" "}
              pro zpracování dat z Excel souborů, službu{" "}
              <a
                href={"https://www.resend.com/"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ED765E] underline underline-offset-4"
              >
                Resend
              </a>{" "}
              pro rozesílání e-mailů a sadu UI komponent{" "}
              <a
                href={"https://ui.shadcn.com/"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ED765E] underline underline-offset-4"
              >
                shadcn/ui
              </a>{" "}
              pro konzistentní a snadno upravitelné uživatelské rozhraní. Do
              budoucna je cílem Certifikátor dále rozvíjet a nabídnout jej i
              dalším školám, kurzům a organizacím, které pracují s větším
              množstvím certifikátů.
            </span>

            <span className="text-justify text-gray-700">
              Podrobný přehled funkcí aplikace naleznete na stránce{" "}
              <Link
                href={"/funkce"}
                className="text-[#ED765E] underline underline-offset-4"
              >
                Funkce.
              </Link>
            </span>
          </div>
        </div>
      </div>
      <FooterOutside />
    </main>
  );
}
