"use client";

import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import React, { useState } from "react";
import { LoaderOverlay } from "@/components/loader-overlay";

export default function ZapomenuteHeslo() {
  const [inputValue, setInputValue] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetMutation = api.emails.requestPasswordResetEmail.useMutation({
    onError: () => {
      setError("Vyskytla se chyba při odesílání e-mailu");
    },

    onSettled: () => {
      setLoading(false);
    }
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    resetMutation.mutate({ email });
  };

  return (
    <main className="flex min-h-screen w-screen flex-col items-center justify-center bg-gradient-to-br from-red-50 via-white to-rose-50 px-4 py-12">

      {loading && <LoaderOverlay />}

      <h1 className="mb-8 text-5xl font-extrabold tracking-tight lg:text-6xl">
        <span className="bg-gradient-primary bg-clip-text text-transparent">
          Certifikátor
        </span>
      </h1>

      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
        <form onSubmit={onSubmit}>
          <FieldSet>
            <FieldLegend>
              <span className="mb-2 text-xl font-bold text-gray-900">
                Zapomenuté heslo
              </span>
            </FieldLegend>
            <FieldDescription className="text-[0.95rem] text-gray-600">
              Resetujte si heslo pomocí odkazu zaslaného na Vaši e-mailovou
              adresu
            </FieldDescription>

            <Field>
              <FieldLabel
                htmlFor="email"
                className="mb-[-0.3rem] text-[0.95rem] font-medium text-gray-700"
              >
                E-mailová adresa
              </FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-[#E65758]"
                onChange={(e) => setInputValue(e.currentTarget.value)}
                value={inputValue}
              />
            </Field>
          </FieldSet>

          {error && (
            <div className="mt-6 rounded-lg bg-red-100 p-3 lg:p-4 text-sm lg:text-base text-red-600">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-primary mt-6 h-10 w-full text-base font-semibold text-white hover:opacity-90 hover:shadow-lg"
          >
            {loading ? "Odesílám..." : "Odeslat"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link
            href="/prihlaseni"
            className="text-[0.95rem] font-medium text-gray-700 hover:text-gray-900"
          >
            Jít zpět
          </Link>
        </div>
      </div>
    </main>
  );
}
