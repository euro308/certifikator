"use client";

import { NavbarOutside } from "@/components/navbar-outside";
import { FooterOutside } from "@/components/footer-outside";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import Image from "next/image";
import {
  Search,
  ShieldCheck,
  ShieldX,
  Loader2,
  User,
  Mail,
  Calendar,
  Hash,
} from "lucide-react";

export default function KontrolaPlatnosti() {
  const [searchValue, setSearchValue] = useState("");
  const [submittedToken, setSubmittedToken] = useState<string | null>(null);

  const {
    data: certificate,
    isLoading,
    isError,
    error,
  } = api.certificates.getByValidationToken.useQuery(
    { validationToken: submittedToken ?? "" },
    { enabled: !!submittedToken, retry: false },
  );

  const handleSearch = () => {
    const trimmed = searchValue.trim();
    if (!trimmed) return;
    setSubmittedToken(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  // Determine state
  const hasSearched = submittedToken !== null;
  const isValid = hasSearched && !isLoading && !isError && !!certificate;
  const isInvalid = hasSearched && !isLoading && isError;

  return (
    <main className="flex min-h-screen max-w-screen flex-col bg-gradient-to-br from-red-50 via-white to-rose-50">
      <NavbarOutside />

      <div className="flex-1 px-4 pt-28 pb-16">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <h1 className="mb-4 text-center text-4xl font-extrabold tracking-tight md:text-5xl">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Kontrola platnosti
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-center text-lg text-gray-600">
            Zde si můžete ověřit, zda je Váš certifikát platný. Jednoduše zadejte
            identifikační klíč, který Vám byl zaslán v původním e-mailu
            s certifikátem.
          </p>

          {/* Search area */}
          <div className="mx-auto mb-10 max-w-xl rounded-2xl bg-white/80 p-6 shadow-lg md:p-8">
            <label
              htmlFor="validation-token"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Identifikační klíč
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute top-2.5 left-3 size-4 text-gray-400" />
                <Input
                  id="validation-token"
                  placeholder="např. abc123def456ghi789"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-white pl-9"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={!searchValue.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Search className="mr-2 size-4" />
                )}
                Ověřit
              </Button>
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="mr-3 size-6 animate-spin text-gray-400" />
              <span className="text-lg text-gray-500">
                Vyhledávám certifikát...
              </span>
            </div>
          )}

          {/* Error / not found */}
          {isInvalid && (
            <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50/80 p-6 text-center shadow-lg md:p-8">
              <ShieldX className="mx-auto mb-3 size-12 text-red-400" />
              <h2 className="mb-2 text-2xl font-bold text-red-700">
                Certifikát nenalezen
              </h2>
              <p className="text-gray-600">
                Certifikát s tímto identifikačním klíčem nebyl nalezen. Zkontrolujte,
                zda jste zadali správný kód z e-mailu.
              </p>
            </div>
          )}

          {/* Valid certificate found */}
          {isValid && certificate && (
            <div className="mx-auto max-w-xl overflow-hidden rounded-2xl bg-white/80 shadow-lg">
              {/* Success header */}
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-5 text-center text-white">
                <ShieldCheck className="mx-auto mb-2 size-10" />
                <h2 className="text-2xl font-bold">Certifikát je platný</h2>
                <p className="mt-1 text-sm text-emerald-100">
                  Tento certifikát byl ověřen a je autentický.
                </p>
              </div>

              {/* Certificate details */}
              <div className="space-y-4 p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <User className="size-5 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Příjemce</p>
                    <p className="font-semibold text-gray-900">
                      {certificate.recipientName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="size-5 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">E-mail</p>
                    <p className="font-medium text-gray-700">
                      {certificate.recipientEmail}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="size-5 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Datum vydání</p>
                    <p className="font-medium text-gray-700">
                      {new Date(certificate.createdAt).toLocaleDateString(
                        "cs-CZ",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                </div>

                {/*
                 * expiresAt — připraveno pro budoucí použití.
                 * Pokud bude v DB sloupec expiresAt, odkomenrovat:
                 *
                 * {certificate.expiresAt && (
                 *   <div className="flex items-center gap-3">
                 *     <Clock className="size-5 shrink-0 text-gray-400" />
                 *     <div>
                 *       <p className="text-xs text-gray-500">Platnost do</p>
                 *       <p className="font-medium text-gray-700">
                 *         {new Date(certificate.expiresAt).toLocaleDateString(
                 *           "cs-CZ",
                 *           { day: "numeric", month: "long", year: "numeric" },
                 *         )}
                 *       </p>
                 *     </div>
                 *   </div>
                 * )}
                 *
                 * Nezapomenout přidat Clock do importu z lucide-react
                 * a expiresAt do DB schématu (schema.ts).
                 */}

                <div className="flex items-center gap-3">
                  <Hash className="size-5 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">ID certifikátu</p>
                    <p className="break-all font-mono text-sm text-gray-600">
                      {certificate.id}
                    </p>
                  </div>
                </div>

                {/* Certificate image preview */}
                {certificate.certificateUrl && (
                  <>
                    <div className="my-2 border-t" />
                    <div className="relative aspect-[1.414/1] w-full overflow-hidden rounded-lg border bg-gray-50">
                      <Image
                        src={certificate.certificateUrl}
                        alt={`Certifikát pro ${certificate.recipientName}`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 600px"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <FooterOutside />
    </main>
  );
}