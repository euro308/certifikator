"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Lock, User } from "lucide-react";
import { authClient } from "@/server/better-auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function NastaveniUzivatele() {
  const { data: session, isPending } = authClient.useSession();
  
  // Profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Initialize form with session data
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [session]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      const promises = [];
      let emailChanged = false;

      // Update name if changed
      if (session?.user?.name !== name) {
        promises.push(
          authClient.updateUser({
            name,
          })
        );
      }

      // Change email if changed
      if (session?.user?.email !== email) {
        emailChanged = true;
        promises.push(
          authClient.changeEmail({
            newEmail: email,
            callbackURL: "/dashboard/nastaveni-uzivatele", // Redirect back here after verification
          })
        );
      }

      if (promises.length === 0) {
        toast.info("Nebyly provedeny žádné změny");
        setIsUpdatingProfile(false);
        return;
      }

      await Promise.all(promises);

      if (emailChanged) {
        toast.success("Profil aktualizován. Zkontrolujte prosím svůj e-mail pro potvrzení nové adresy.");
      } else {
        toast.success("Profil byl úspěšně aktualizován");
      }
      
    } catch (error) {
        toast.error(error instanceof Error ? error.message : "Došlo k chybě při aktualizaci profilu");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Nová hesla se neshodují");
      return;
    }

    if (newPassword.length < 8) {
       toast.error("Heslo musí mít alespoň 8 znaků");
       return;
    }

    setIsChangingPassword(true);

    try {
      await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      }, {
        onSuccess: () => {
            toast.success("Heslo bylo úspěšně změněno");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        },
        onError: (ctx) => {
            toast.error(ctx.error.message || "Nepodařilo se změnit heslo");
        }
      });
    } catch {
      toast.error("Došlo k neočekávané chybě");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto px-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nastavení uživatele</h1>
        <p className="text-muted-foreground">
          Správa vašeho účtu a nastavení zabezpečení.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card className="pb-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="size-5 text-muted-foreground" />
              <CardTitle>Osobní údaje</CardTitle>
            </div>
            <CardDescription>
              Změňte své jméno a e-mailovou adresu.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdateProfile}>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Jméno</Label>
                <Input
                  id="name"
                  placeholder="Vaše jméno"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isUpdatingProfile}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vas@email.cz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isUpdatingProfile}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t mt-6 px-6 py-4 bg-muted/50 flex justify-end">
              <Button type="submit" disabled={isUpdatingProfile}>
                {isUpdatingProfile ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Ukládám...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    Uložit změny
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Password Settings */}
        <Card className={"pb-0"}>
          <CardHeader>
             <div className="flex items-center gap-2">
              <Lock className="size-5 text-muted-foreground" />
              <CardTitle>Změna hesla</CardTitle>
            </div>
            <CardDescription>
              Pro změnu hesla zadejte své současné heslo a poté nové heslo.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleChangePassword}>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current-password">Současné heslo</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isChangingPassword}
                  required
                />
              </div>
              <Separator className="my-2" />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="new-password">Nové heslo</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isChangingPassword}
                    required
                    minLength={8}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Potvrzení hesla</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isChangingPassword}
                    required
                    minLength={8}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t mt-6 px-6 py-4 bg-muted/50 flex justify-end">
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Měním heslo...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    Změnit heslo
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
    </main>
  );
}
