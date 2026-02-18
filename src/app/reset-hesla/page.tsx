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
import React, { useEffect, useState } from "react";
import { LoaderOverlay } from "@/components/loader-overlay";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/trpc/react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/server/better-auth/client";
import { router } from "next/client";

export default function ResetHesla() {
  const [firstPassword, setFirstPassword] = useState<string>("");
  const [secondPassword, setSecondPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenNotFound, setTokenNotFound] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!searchParams.get("token")) {
      setTokenNotFound(true);
    }
    if(searchParams.get("token")) {
      setToken(searchParams.get("token")!);
    }
  }, [searchParams]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Hesla se neshodují");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Heslo musí mít alespoň 8 znaků");
      return;
    }

    setIsChangingPassword(true);

    try {
      await authClient.changePassword(
        {
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        },
        {
          onSuccess: () => {
            toast.success("Heslo bylo úspěšně změněno");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || "Nepodařilo se změnit heslo");
          },
        },
      );
    } catch {
      toast.error("Došlo k neočekávané chybě");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (firstPassword !== secondPassword) {
      setError("Hesla se neshodují");
      return;
    }

    if (firstPassword.length < 8 || secondPassword.length < 8) {
      setError("Heslo musí mít alespoň 8 znaků");
      return;
    }

    setLoading(true);
    const { data: result, isError } =
      api.passwordResets.checkForValidToken.useQuery({ token: token });

    if (!result || isError || result.expiresAt < new Date()) {
      setLoading(false);
      setError(
        "Token je neplatný! Zkuste si znovu zažádat o resetování hesla.",
      );
      return;
    }

    await authClient.resetPassword({
      newPassword: firstPassword,
    }, {
      onSuccess: () => {
        setLoading(false);
        router.push("/prihlaseni");
      },
      onError: () => {
        setLoading(false);
        setError("Nastala chyba!")
        return;
      }
    });

    setLoading(false);
  };

  return (
    <main className="flex min-h-screen w-screen flex-col items-center justify-center bg-gradient-to-br from-red-50 via-white to-rose-50 px-4 py-12">
      {(loading) && <LoaderOverlay />}

      <h1 className="mb-8 text-5xl font-extrabold tracking-tight lg:text-6xl">
        <span className="bg-gradient-primary bg-clip-text text-transparent">
          Certifikátor
        </span>
      </h1>

      {tokenNotFound ?
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
          <span>Oops! Odkaz je neplatný. Pro vrácení na hlavní stránku využijte tento{" "}
          <Link href={"/"} className={"underline bg-gradient-primary bg-clip-text text-transparent"}>odkaz.</Link>
          </span>
        </div>  : (
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
          <form onSubmit={onSubmit}>
            <FieldSet>
              <FieldLegend>
                <span className="mb-2 text-xl font-bold text-gray-900">
                  Obnova hesla
                </span>
              </FieldLegend>
              <FieldDescription className="text-[0.95rem] text-gray-600">
                Zde si obnovte heslo ke svému účtu
              </FieldDescription>

              <Field>
                <FieldLabel
                  htmlFor="firstPassword"
                  className="mb-[-0.3rem] text-[0.95rem] font-medium text-gray-700"
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
                    className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 bg-transparent p-0 hover:cursor-pointer hover:bg-transparent lg:h-10 lg:w-10 xl:h-12 xl:w-12"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-500 lg:h-6 lg:w-6" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500 lg:h-6 lg:w-6" />
                    )}
                  </Button>
                </div>
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="secondPassword"
                  className="mb-[-0.3rem] text-[0.95rem] font-medium text-gray-700"
                >
                  Nové heslo podruhé
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
              <div className="mt-6 rounded-lg bg-red-100 p-3 text-sm text-red-600 lg:p-4 lg:text-base">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-primary mt-6 h-10 w-full text-base font-semibold text-white hover:opacity-90 hover:shadow-lg"
            >
              {loading ? "Obnovuji..." : "Obnovit heslo"}
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
      )}
    </main>
  );
}
