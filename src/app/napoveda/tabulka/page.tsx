import { NavbarOutside } from "@/components/navigation/navbar-outside";
import { FooterOutside } from "@/components/navigation/footer-outside";
import {
  Table,
  FileSpreadsheet,
  Columns,
  CheckCircle2,
  AlertTriangle,
  Gauge,
} from "lucide-react";
import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jak připravit tabulku pro Certifikátor | Certifikátor",
  description:
    "Návod, jak správně naformátovat data v Excelu nebo CSV pro bezproblémové hromadné generování certifikátů.",
};

export default function NapovedaTabulka() {
  return (
    <main className="flex min-h-screen max-w-screen flex-col bg-gradient-to-br from-red-50 via-white to-rose-50 text-justify">
      <NavbarOutside />

      <div className="flex-1 px-4 pt-28 pb-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Table className="h-6 w-6" />
            </div>
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Jak připravit tabulku s daty
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Správně strukturovaná tabulka je základem pro rychlé a
              bezproblémové vygenerování stovek certifikátů najednou.
            </p>
          </div>

          <div className="space-y-12">
            {/* Podporované formáty */}
            <section>
              <div className="mb-6 flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-neutral-800" />
                <h2 className="text-2xl font-bold tracking-tight">
                  Podporované formáty souborů
                </h2>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <p className="mb-4 text-gray-700">
                  Certifikátor si aktuálně poradí s běžnými formáty tabulek,
                  které exportujete například z Microsoft Excelu, Google Tabulek
                  (Google Sheets) nebo Numbers na Macu. Konkrétně rozeznáváme
                  tyto přípony:
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 font-medium text-green-700">
                    <CheckCircle2 className="h-5 w-5" /> .xlsx
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 font-medium text-green-700">
                    <CheckCircle2 className="h-5 w-5" /> .xls
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 font-medium text-blue-700">
                    <CheckCircle2 className="h-5 w-5" /> .csv
                  </div>
                </div>
              </div>
            </section>

            {/* Pravidla struktury */}
            <section>
              <div className="mb-6 flex items-center gap-3">
                <Columns className="h-8 w-8 text-blue-600" />
                <h2 className="text-2xl font-bold tracking-tight">
                  Správná struktura tabulky
                </h2>
              </div>

              <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    První řádek = Názvy sloupců
                  </h3>
                  <p className="text-gray-600">
                    Systém hledá jména sloupců vždy{" "}
                    <strong>v úplně prvním řádku celého dokumentu</strong>.
                    Proto nesmí být nad hlavičkou tabulky žádný volný řádek ani
                    jiný text (například nadpis dokumentu).
                  </p>
                  <p className="mt-2 text-gray-600">
                    Názvy těchto sloupců navíc budou použity pro snadné napojení
                    proměnných do Vašeho certifikátu.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="relative overflow-hidden rounded-xl border border-red-200 bg-red-50 p-4 pt-4">
                    <span className="absolute top-0 right-0 rounded-bl-lg bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                      ŠPATNĚ
                    </span>
                    <table className="w-full border-collapse bg-white text-left text-sm">
                      <tbody>
                        <tr>
                          <td
                            className="border border-red-200 p-2 text-gray-500 italic"
                            colSpan={3}
                          >
                            Účastníci kurzu Q3
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-red-200 p-2">&nbsp;</td>
                          <td className="border border-red-200 p-2">&nbsp;</td>
                          <td className="border border-red-200 p-2">&nbsp;</td>
                        </tr>
                        <tr>
                          <td className="border border-red-300 bg-red-100 p-2 font-bold">
                            Jméno
                          </td>
                          <td className="border border-red-300 bg-red-100 p-2 font-bold">
                            E-mail
                          </td>
                          <td className="border border-red-300 bg-red-100 p-2 font-bold">
                            Název kurzu
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="relative overflow-hidden rounded-xl border border-green-200 bg-green-50 p-4 pt-4">
                    <span className="absolute top-0 right-0 rounded-bl-lg bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
                      SPRÁVNĚ
                    </span>
                    <table className="w-full border-collapse bg-white text-left text-sm">
                      <thead>
                        <tr>
                          <th className="border border-green-300 bg-green-100 p-2 font-bold text-gray-900">
                            Jméno
                          </th>
                          <th className="border border-green-300 bg-green-100 p-2 font-bold text-gray-900">
                            E-mail
                          </th>
                          <th className="border border-green-300 bg-green-100 p-2 font-bold text-gray-900">
                            Název kurzu
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-green-200 p-2">
                            Jan Novák
                          </td>
                          <td className="border border-green-200 p-2">
                            jan@novak.cz
                          </td>
                          <td className="border border-green-200 p-2">PO-ZŠ</td>
                        </tr>
                        <tr>
                          <td className="border border-green-200 p-2">
                            Eva Malá
                          </td>
                          <td className="border border-green-200 p-2">
                            emala@email.cz
                          </td>
                          <td className="border border-green-200 p-2">PO-ZŠ</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Čistá data bez formátování a vzorců
                  </h3>
                  <p className="text-gray-600">
                    Pro bezchybné propsání údajů na certifikát je klíčové mít v
                    buňkách pouze čistý text. Zkontrolujte, zda Vaše data
                    neobsahují zbytečné mezery na konci slov (např.{" "}
                    <code>&#34;Jan Novák &nbsp; &nbsp;&#34;</code>), které by
                    rozhodily centrování textu na výsledném certifikátu.
                  </p>
                  <p className="mt-2 text-gray-600">
                    Pokud v tabulce používáte Excelové vzorce (např.{" "}
                    <code>=KDYŽ()</code>, <code>=SVYHLEDAT()</code>),
                    doporučujeme před nahráním celou tabulku zkopírovat a vložit
                    zpět jako <strong>Hodnoty</strong> (Vložit jinak &gt;
                    Hodnoty). Certifikátor tím získá čistá textová data a
                    předejdete případným chybám při jejich čtení.
                  </p>
                </div>
              </div>
            </section>

            {/* Optimalizace rychlosti */}
            <section>
              <div className="mb-6 flex items-center gap-3">
                <Gauge className={"size-8"} color={"#fe9a00"} />
                <h2 className="text-2xl font-bold tracking-tight">
                  Tipy pro zrychlení procesu
                </h2>
              </div>

              <div className="flex flex-col gap-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 md:flex-row">
                <div className="space-y-4 text-amber-900">
                  <h3 className="text-lg font-bold">Vymažte zbytečná data</h3>
                  <p className="text-amber-800">
                    Příliš velké tabulky (se spoustou sloupců a desítkami tisíc
                    řádků){" "}
                    <strong>zpomalují zpracování souboru v prohlížeči</strong>,
                    obzvláště pokud většinu takových dat při tvorbě certifikátu
                    vůbec nevyužijete (např. IP adresa účastníka, typ platby,
                    adresa bydliště, apod.).
                  </p>
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200/50 bg-white/50 p-4">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <p className="text-sm font-medium">
                      Před nahráním tabulky do naší platformy je{" "}
                      <strong>ideální z ní rovnou smazat sloupce</strong> s
                      údaji, o kterých víte, že je do žádného certifikátu
                      vkládat nebudete. Stejně tak je vhodné tabulku{" "}
                      <strong>pročistit o prázdné či zbytečné řádky.</strong>{" "}
                      Ušetříte tak spoustu času při zpracovávání dat v aplikaci.
                    </p>
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
