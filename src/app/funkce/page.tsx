import Image from "next/image";
import { NavbarOutside } from "@/components/navbar-outside";
import { FooterOutside } from "@/components/footer-outside";

export default function Funkce() {
  return (
    <main className="flex min-h-screen max-w-screen flex-col bg-gradient-to-br from-red-50 via-white to-rose-50">
      <NavbarOutside />

      <div className="flex-1 px-4 pt-28 pb-16">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-10 text-center text-4xl font-extrabold tracking-tight md:text-5xl">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Funkce Certifikátoru
            </span>
          </h1>

          {/* Funkce 1 */}
          <div className="mb-10 flex flex-col items-center gap-6 rounded-2xl bg-white/80 p-6 text-justify shadow-lg md:flex-row md:p-8">
            <div className="flex-1">
              <h2 className="mb-2 text-3xl font-bold text-gray-900">
                Navrhni šablonu přesně podle sebe
              </h2>
              <span className="text-justify text-lg text-gray-700">
                V intuitivním editoru si během pár minut navrhněte vlastní
                šablonu certifikátu – texty, loga, barvy i grafické prvky přesně
                podle vašich potřeb. Vše běží na canvasovém prostředí{" "}
                <a
                  href={"https://konvajs.org/"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ED765E] underline underline-offset-4"
                >
                  Konva
                </a>
                , takže lze prvky pohodlně přesouvat, zarovnávat a upravovat
                přímo na plátně.
              </span>
            </div>
            <Image
              className="h-48 w-full max-w-sm rounded-xl bg-gray-200 object-cover md:h-64"
              alt="funkce1"
              src={null}
            />
          </div>

          {/* Funkce 2 */}
          <div className="mb-10 flex flex-col items-center gap-6 rounded-2xl bg-white/80 p-6 text-justify shadow-lg md:flex-row-reverse md:p-8">
            <div className="flex-1">
              <h2 className="mb-2 text-3xl font-bold text-gray-900">
                Jeden Excel, stovky certifikátů
              </h2>
              <span className="text-lg text-gray-700">
                Místo ručního přepisování stačí nahrát Excel tabulku se seznamem
                účastníků a Certifikátor automaticky vyplní jména a další údaje
                do vybrané šablony. Díky knihovně{" "}
                <a
                  href={"https://sheetjs.com/"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ED765E] underline underline-offset-4"
                >
                  SheetJS
                </a>{" "}
                zvládnete hromadně vygenerovat desítky až stovky certifikátů na
                pár kliknutí.
              </span>
            </div>
            <Image
              className="h-48 w-full max-w-sm rounded-xl bg-gray-200 object-cover md:h-64"
              alt="funkce2"
              src={null}
            />
          </div>

          {/* Funkce 3 */}
          <div className="mb-10 flex flex-col items-center gap-6 rounded-2xl bg-white/80 p-6 text-justify shadow-lg md:flex-row md:p-8">
            <div className="flex-1">
              <h2 className="mb-2 text-3xl font-bold text-gray-900">
                Ruční zasílání? Nikdy více
              </h2>
              <span className="text-lg text-gray-700">
                Vygenerované certifikáty není třeba rozesílat ručně –
                Certifikátor je dokáže automaticky poslat příjemcům na jejich
                e-mailové adresy. Stačí jednou nastavit šablonu zprávy a služba{" "}
                <a
                  href={"https://www.mailgun.com/"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ED765E] underline underline-offset-4"
                >
                  Mailgun
                </a>{" "}
                se postará o doručení každému účastníku zvlášť.
              </span>
            </div>
            <Image
              className="h-48 w-full max-w-sm rounded-xl bg-gray-200 object-cover md:h-64"
              alt="funkce3"
              src={null}
            />
          </div>

          {/* Funkce 4 */}
          <div className="mb-10 flex flex-col items-center gap-6 rounded-2xl bg-white/80 p-6 text-justify shadow-lg md:flex-row-reverse md:p-8">
            <div className="flex-1">
              <h2 className="mb-2 text-3xl font-bold text-gray-900">
                Platný, nebo fejk? Ověř to hned
              </h2>
              <span className="text-lg text-gray-700">
                Každý certifikát má svůj unikátní validační kód, díky kterému si
                může jeho držitel ověřit, zda je dokument skutečný a nebyl
                upraven. Stačí kód zadat do validačního formuláře na webu a
                Certifikátor zobrazí informaci o platnosti certifikátu.
              </span>
            </div>
            <Image
              className="h-48 w-full max-w-sm rounded-xl bg-gray-200 object-cover md:h-64"
              alt="funkce4"
              src={null}
            />
          </div>

          {/* Funkce 5 */}
          <div className="mb-10 flex flex-col items-center gap-6 rounded-2xl bg-white/80 p-6 text-justify shadow-lg md:flex-row md:p-8">
            <div className="flex-1">
              <h2 className="mb-2 text-3xl font-bold text-gray-900">
                Najdi šablonu, klikni a používej
              </h2>
              <span className="text-lg text-gray-700">
                V galerii máte přehled všech svých šablon a snadno se vrátíte k
                těm, které už jste někdy použili. Zároveň je k dispozici veřejná
                galerie, kde najdete předpřipravené šablony, které můžete rovnou
                použít nebo si je upravit podle sebe. Své šablony také můžete
                jedním kliknutím publikovat a nabídnout ji tak ostatním
                uživatelům Certifikátoru.
              </span>
            </div>
            <Image
              className="h-48 w-full max-w-sm rounded-xl bg-gray-200 object-cover md:h-64"
              alt="funkce5"
              src={null}
            />
          </div>

          {/* Funkce 6 */}
          <div className="mb-10 flex flex-col items-center gap-6 rounded-2xl bg-white/80 p-6 text-justify shadow-lg md:flex-row-reverse md:p-8">
            <div className="flex-1">
              <h2 className="mb-2 text-3xl font-bold text-gray-900">
                Certifikáty zpracuje API za tebe
              </h2>
              <span className="text-lg text-gray-700">
                Program nabízí jednoduché API, díky kterému jej lze propojit s
                dalšími systémy, jako jsou přihlašovací formuláře, interní IS
                školy nebo externí aplikace. To Vám umožní generovat a rozesílat
                certifikáty automaticky na základě událostí ve Vašich vlastních
                systémech.
              </span>
            </div>
            <Image
              className="h-48 w-full max-w-sm rounded-xl bg-gray-200 object-cover md:h-64"
              alt="funkce6"
              src={null}
            />
          </div>
        </div>
      </div>

      <FooterOutside />
    </main>
  );
}
