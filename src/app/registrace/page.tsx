"use client";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/server/better-auth/client";
import { LoaderOverlay } from "@/components/loader-overlay";

export default function Registrace() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (error) {
        setError(error.message ?? "Nepodařilo se zaregistrovat");
        return;
      }

      // Úspěšná registrace - redirect
      router.push("/prihlaseni?success=true");
    } catch (err) {
      setError("Něco se pokazilo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-screen flex-col items-center justify-center bg-gradient-to-br from-red-50 via-white to-rose-50 px-4 py-12">

      {loading && <LoaderOverlay />}

      <h1 className="mb-8 text-6xl font-extrabold tracking-tight lg:text-7xl xl:text-8xl">
        <span className="bg-gradient-primary bg-clip-text text-transparent">
          Certifikátor
        </span>
      </h1>

      <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl rounded-2xl border border-gray-200 bg-white p-8 lg:p-10 xl:p-12 shadow-xl">
        <form onSubmit={handleSubmit}>
          <FieldSet>
            <FieldLegend>
              <span className="mb-2 text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">
                Zaregistrovat se
              </span>
            </FieldLegend>
            <FieldDescription className="text-[0.95rem] lg:text-base xl:text-lg text-gray-600">
              Zaregistrujte se pomocí vaší e-mailové adresy a hesla
            </FieldDescription>

            <FieldGroup>
              <Field>
                <FieldLabel
                  htmlFor="username"
                  className="mb-[-0.3rem] text-[0.95rem] lg:text-base xl:text-lg font-medium text-gray-700"
                >
                  Přezdívka
                </FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 lg:px-5 lg:py-4 xl:px-6 xl:py-5 text-base lg:text-lg focus:border-transparent focus:ring-2 focus:ring-[#E65758]"
                />
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="email"
                  className="mb-[-0.3rem] text-[0.95rem] lg:text-base xl:text-lg font-medium text-gray-700"
                >
                  E-mailová adresa
                </FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 lg:px-5 lg:py-4 xl:px-6 xl:py-5 text-base lg:text-lg focus:border-transparent focus:ring-2 focus:ring-[#E65758]"
                />
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="password"
                  className="mb-[-0.3rem] text-[0.95rem] lg:text-base xl:text-lg font-medium text-gray-700"
                >
                  Heslo
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 lg:px-5 lg:py-4 xl:px-6 xl:py-5 pr-12 lg:pr-14 xl:pr-16 text-base lg:text-lg focus:border-transparent focus:ring-2 focus:ring-[#E65758]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute top-1/2 right-2 h-8 w-8 lg:h-10 lg:w-10 xl:h-12 xl:w-12 -translate-y-1/2 bg-transparent p-0 hover:bg-transparent hover:cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="text-gray-500 w-5 h-5 lg:w-6 lg:h-6" />
                    ) : (
                      <Eye className="text-gray-500 w-5 h-5 lg:w-6 lg:h-6" />
                    )}
                  </Button>
                </div>
              </Field>
            </FieldGroup>
          </FieldSet>

          {error && (
            <div className="mt-6 rounded-lg bg-red-100 p-3 lg:p-4 text-sm lg:text-base text-red-600">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-primary mt-6 h-10 lg:h-12 xl:h-14 w-full text-base lg:text-lg xl:text-xl font-semibold text-white hover:opacity-90 hover:shadow-lg hover:cursor-pointer"
          >
            {loading ? "Registruji..." : "Zaregistrovat se"}
          </Button>
        </form>

        <div className="mt-4 lg:mt-6 text-center">
          <span className="text-lg lg:text-lg xl:text-xl text-gray-600">
            Již máte účet?{" "}
            <Link
              href="/prihlaseni"
              className="font-medium text-[#E65758] transition-colors hover:text-[#771D32]"
            >
              Přihlásit se
            </Link>
          </span>
        </div>
      </div>
    </main>
  );
}
