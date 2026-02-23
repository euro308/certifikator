"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Lock, User, Upload, Trash2 } from "lucide-react";
import { authClient } from "@/server/better-auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ImageCropperDialog } from "@/components/user/profile-picture/image-cropper-dialog";
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
  const [image, setImage] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);

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
      setImage(session.user.image ?? "");
    }
  }, [session]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Obrázek nesmí být větší než 20 MB.");
      return;
    }

    try {
      const imageUrl = URL.createObjectURL(file);
      setCropperImageSrc(imageUrl);
      setCropperOpen(true);
    } catch {
      toast.error("Zvolený soubor se nepodařilo načíst k ořezu.");
    } finally {
      e.target.value = "";
    }
  };

  const handleCropComplete = (base64CroppedImage: string) => {
    setImage(base64CroppedImage);
    toast.success("Obrázek byl upraven. Nezapomeňte změny uložit.");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      const promises = [];
      let emailChanged = false;

      // Update name/image if changed
      const originalImage = session?.user?.image ?? "";
      if (session?.user?.name !== name || originalImage !== image) {
        promises.push(
          authClient.updateUser({
            name,
            image: image || null,
          }),
        );
      }

      // Change email if changed
      if (session?.user?.email !== email) {
        emailChanged = true;
        promises.push(
          authClient.changeEmail({
            newEmail: email,
            callbackURL: "/dashboard/nastaveni-uzivatele", // Redirect back here after verification
          }),
        );
      }

      if (promises.length === 0) {
        toast.info("Nebyly provedeny žádné změny");
        setIsUpdatingProfile(false);
        return;
      }

      await Promise.all(promises);

      if (emailChanged) {
        toast.success(
          "Profil aktualizován. Zkontrolujte prosím svůj e-mail pro potvrzení nové adresy.",
        );
      } else {
        toast.success("Profil byl úspěšně aktualizován");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Došlo k chybě při aktualizaci profilu",
      );
    } finally {
      setIsUpdatingProfile(false);
    }
  };

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

  if (isPending) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
    email?.charAt(0).toUpperCase() ||
    "U";

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Nastavení uživatele
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Správa Vašeho účtu a nastavení zabezpečení.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card className="pb-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="text-muted-foreground size-5" />
              <CardTitle>Osobní údaje</CardTitle>
            </div>
            <CardDescription>
              Změňte své jméno a e-mailovou adresu.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdateProfile}>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar className="h-24 w-24 border">
                  <AvatarImage
                    src={image || undefined}
                    alt={name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {initials || <User className="size-8" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium">Profilová fotografie</h3>
                  <p className="text-muted-foreground max-w-sm text-xs">
                    Podporujeme formáty JPG, PNG a WebP do velikosti 20 MB.
                    Obrázek bude automaticky zmenšen.
                  </p>
                  <div className="mt-1 flex gap-2">
                    <Label
                      htmlFor="avatar-upload"
                      className="focus-visible:ring-ring bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex h-9 cursor-pointer items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                    >
                      <Upload className="mr-2 size-4" />
                      Nahrát fotku
                    </Label>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUpdatingProfile}
                    />
                    {image && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setImage("")}
                        disabled={isUpdatingProfile}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

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
            <CardFooter className="bg-muted/50 mt-6 flex justify-end border-t px-6 py-4">
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
              <Lock className="text-muted-foreground size-5" />
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
            <CardFooter className="bg-muted/50 mt-6 flex justify-end border-t px-6 py-4">
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

      <ImageCropperDialog
        isOpen={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={cropperImageSrc}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
