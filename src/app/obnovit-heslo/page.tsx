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
import React, { useState, Suspense } from "react";
import { LoaderOverlay } from "@/components/shared/loader-overlay";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/server/better-auth/client";

function ResetHeslaContent() {
  const [firstPassword, setFirstPassword] = useState<string>("");
  const [secondPassword, setSecondPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (firstPassword !== secondPassword) {
      setError("Hesla se neshodují");
      return;
    }

    if (firstPassword.length < 8) {
      setError("Heslo musí mít alespoň 8 znaků");
      return;
    }

    setLoading(true);

    try {
      await authClient.resetPassword(
        {
          newPassword: firstPassword,
          token: tokenFromUrl,
        },
        {
          onSuccess: () => {
            toast.success("Heslo bylo úspěšně změněno");
            router.push("/prihlaseni");
          },
          onError: (ctx) => {
            setLoading(false);
            setError(
              ctx.error.message ||
                "Nepodařilo se obnovit heslo. Token může být neplatný.",
            );
          },
        },
      );
    } catch {
      setLoading(false);
      setError("Nastala neočekávaná chyba!");
    }
  };

  return (
    <main className="flex min-h-screen w-screen flex-col items-center justify-center bg-gradient-to-br from-red-50 via-white to-rose-50 px-4 py-12">
      {loading && <LoaderOverlay />}

      <h1 className="mb-8 text-5xl font-extrabold tracking-tight lg:text-6xl">
        <span className="bg-gradient-primary bg-clip-text text-transparent">
          Certifikátor
        </span>
      </h1>

      {!tokenFromUrl ? (
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xl">
          <div className="mb-4 text-red-500">
            <h2 className="mb-2 text-xl font-bold">
              Odkaz je neplatný nebo vypršel
            </h2>
            <p className="text-gray-600">
              Pro obnovu hesla si prosím zažádejte o nový odkaz.
            </p>
          </div>
          <Link
            href="/zapomenute-heslo"
            className="font-semibold text-[#E65758] underline"
          >
            Zažádat o nový odkaz
          </Link>
          <div className="mt-4">
            <Link href="/" className="text-sm text-gray-500 hover:underline">
              Zpět na hlavní stránku
            </Link>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
          <form onSubmit={onSubmit}>
            <FieldSet>
              <FieldLegend>
                <span className="mb-2 text-xl font-bold text-gray-900">
                  Obnova hesla
                </span>
              </FieldLegend>
              <FieldDescription className="text-[0.95rem] text-gray-600">
                Zde si nastavte své nové heslo.
              </FieldDescription>

              <Field>
                <FieldLabel
                  htmlFor="firstPassword"
                  className="mb-1 text-[0.95rem] font-medium text-gray-700"
                >
                  Nové heslo
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="firstPassword"
                    name="firstPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-[#E65758]"
                    onChange={(e) => setFirstPassword(e.currentTarget.value)}
                    value={firstPassword}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 p-0 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="size-5 text-gray-400" />
                    ) : (
                      <Eye className="size-5 text-gray-400" />
                    )}
                  </Button>
                </div>
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="secondPassword"
                  className="mb-1 text-[0.95rem] font-medium text-gray-700"
                >
                  Potvrzení nového hesla
                </FieldLabel>
                <Input
                  id="secondPassword"
                  name="secondPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-[#E65758]"
                  onChange={(e) => setSecondPassword(e.currentTarget.value)}
                  value={secondPassword}
                />
              </Field>
            </FieldSet>

            {error && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-primary mt-6 h-12 w-full text-base font-semibold text-white shadow-sm hover:opacity-90"
            >
              {loading ? <>Obnovuji...</> : "Obnovit heslo"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/prihlaseni"
              className="text-sm font-medium text-gray-500 hover:text-gray-900 hover:underline"
            >
              Zpět na přihlášení
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ResetHesla() {
  return (
    <Suspense fallback={<LoaderOverlay />}>
      <ResetHeslaContent />
    </Suspense>
  );
}
