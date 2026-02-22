import { NavbarOutside } from "@/components/navbar-outside";
import { FooterOutside } from "@/components/footer-outside";
import { Keyboard, Type, MousePointerClick, Zap, Eye, Command, Layers } from "lucide-react";
import React from "react";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tipy a triky k editoru | Certifikátor",
  description: "Objevte spoustu užitečných funkcí a klávesových zkratek, které Vám zrychlí práci s naším editorem certifikátů.",
};

export default function NapovedaEditor() {
  return (
    <main className="flex min-h-screen max-w-screen flex-col bg-gradient-to-br from-red-50 via-white to-rose-50">
      <NavbarOutside />

      <div className="flex-1 px-4 pt-28 pb-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl mb-4">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Tipy a triky k editoru
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Zefektivněte si práci a tvořte krásné certifikáty ještě rychleji s našimi tipy a skrytými vychytávkami.
            </p>
          </div>

          <div className="space-y-12">
            {/* Klávesové zkratky */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Keyboard className="h-8 w-8 text-neutral-800" />
                <h2 className="text-2xl font-bold tracking-tight">Klávesové zkratky</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <ShortcutCard
                  keys={["Ctrl", "C"]}
                  desc="Zkopírovat označený prvek a vytvořit jeho kopii poblíž."
                />
                <ShortcutCard
                  keys={["Delete"]}
                  desc="Smazat aktuálně označený prvek z plátna."
                />
                <ShortcutCard
                  keys={["Ctrl", "Z"]}
                  desc="Vrátit poslední změnu (Undo)."
                />
                <ShortcutCard
                  keys={["Ctrl", "Shift", "Z"]}
                  desc="Obnovit vrácenou změnu (Redo)."
                />
                <ShortcutCard
                  keys={["Šipky"]}
                  desc="Posouvat označený prvek po jednom pixelu (nebo po 10 pixelech při současném stisku Shift)."
                />
                <ShortcutCard
                  keys={["Ctrl", "B"]}
                  desc="Zapnout / vypnout tučný text (Bold)."
                />
                <ShortcutCard
                  keys={["Ctrl", "I"]}
                  desc="Zapnout / vypnout kurzívu (Italic)."
                />
                <ShortcutCard
                  keys={["Ctrl", "U"]}
                  desc="Zapnout / vypnout podtržení (Underline)."
                />
              </div>
            </section>

            {/* Proměnné v textu */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Type className="h-8 w-8 text-blue-600" />
                <h2 className="text-2xl font-bold tracking-tight">Inteligentní textové hodnoty</h2>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Proměnné přímo uvnitř textu</h3>
                  <p className="text-gray-600">
                    Místo skládání jména vedle zbytku věty pomocí klasických "Placeholder" bloků, můžete obojí nakombinovat přímo do normálního textu!
                  </p>
                  <p className="text-gray-600">
                    Stačí přidat textový blok a napsat do něj proměnnou (nebo více proměnných) uzavřenou ve dvou složených závorkách, například <kbd className="px-1.5 py-0.5 rounded border bg-gray-50 text-xs font-mono">{"{{"}Jmeno{"}}"}</kbd>.
                    Editor text před generováním projde, klíč si automaticky založí jako sloupeček, a doplní za něj hodnoty stejným stylem fontu v celém odstavci!
                  </p>
                </div>
                <div className="relative w-full md:w-5/12 aspect-video bg-gray-100 rounded-xl overflow-hidden border flex items-center justify-center shrink-0">
                  <Image
                    src="/napoveda-editor/promenne.gif"
                    alt="Ukázka chytrých proměnných v textu"
                    fill
                    className="object-cover object-center"
                    unoptimized
                  />
                </div>
              </div>
            </section>

            {/* Rychlé akce a kontextové menu */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <MousePointerClick className="h-8 w-8 text-amber-500" />
                <h2 className="text-2xl font-bold tracking-tight">Kontextové menu</h2>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm flex flex-col-reverse md:flex-row gap-6 items-center">
                <div className="relative w-full md:w-5/12 aspect-video bg-gray-100 rounded-xl overflow-hidden border flex items-center justify-center shrink-0">
                  <Image
                    src="/napoveda-editor/kontext.gif"
                    alt="Ukázka kontextového menu editoru"
                    fill
                    className="object-cover object-center"
                    unoptimized
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Rychlé volby přes pravé tlačítko myši</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex gap-2">
                      <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                      <span><strong>Klik do prázdna:</strong> Otevře nabídku pro přidání nového tvaru a textu rovnou tam, kde máte myš.</span>
                    </li>
                    <li className="flex gap-2">
                      <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                      <span><strong>Klik na prvek:</strong> Umožní prvek bleskově smazat, zkopírovat, pootočit po 90 stupních, nebo zrcadlově překlopit!</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Vodítka a vrstvy */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Layers className="h-8 w-8 text-emerald-600" />
                <h2 className="text-2xl font-bold tracking-tight">Pokročilý layout</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Chytrá přichytávací vodítka</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Při pohybu objektů se automaticky objevují růžová vodítka. Ta vám pomohu objekt bleskově zarovnat na střed certifikátu, nebo jej lícovat vzhledem k okrajům a středům jiných objektů na plátně.
                  </p>
                  <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden border flex items-center justify-center shrink-0">
                    <Image
                      src="/napoveda-editor/voditka.gif"
                      alt="Ukázka přichytávacích vodítek"
                      fill
                      className="object-cover object-center"
                      unoptimized
                    />
                  </div>
                </div>

                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Myš a pohyb po pracovní ploše</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Nevidíte na detaily? Kolečkem myši si můžete plochu <strong>přiblížit a oddálit</strong>. A pokud zmáčknete <strong>prostřední tlačítko myši</strong> (kolečko), můžete plátno uchopit a po ploše libovolně <strong>posouvat</strong> (tzv. Panování).
                  </p>
                  <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden border flex items-center justify-center shrink-0">
                    <Image
                      src="/napoveda-editor/pohyb.gif"
                      alt="Ukázka posouvání a přibližování plochy"
                      fill
                      className="object-cover object-center"
                      unoptimized
                    />
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>

      <FooterOutside />
    </main>
  );
}

function ShortcutCard({ keys, desc }: { keys: string[], desc: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-1 shrink-0">
        {keys.map((key, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-gray-400 text-xs font-semibold">+</span>}
            <kbd className="inline-flex min-w-[30px] items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-sm font-medium text-gray-900 shadow-[0_2px_0_0_rgba(229,231,235,1)]">
              {key}
            </kbd>
          </React.Fragment>
        ))}
      </div>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  );
}