"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoaderOverlay } from "@/components/shared/loader-overlay";
import { authClient } from "@/server/better-auth/client";
import { useRouter } from "next/navigation";
import { Settings, LogOut } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function UserButton() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          setIsLoggingOut(false);
          router.push("/");
        },
      },
    });
  };

  if (isPending) {
    return (
      <div className="flex items-center gap-3 p-2 select-none">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  const user = session.user;
  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
    user.email?.charAt(0).toUpperCase() ||
    "U";

  return (
    <>
      {isLoggingOut && <LoaderOverlay />}

      <DropdownMenu>
        <DropdownMenuTrigger className="cursor-pointer rounded-[0.5rem] p-2 transition outline-none hover:bg-black/5">
          <div className="flex cursor-pointer items-center gap-3 transition-opacity select-none">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={user.image ?? undefined}
                alt={user.name || "User"}
              />
              <AvatarFallback className="bg-gradient-primary font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col items-start">
              <span className="text-base font-semibold text-gray-900">
                {user.name || "Uživatel"}
              </span>
              <span className="text-sm text-gray-500">{user.email}</span>
            </div>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="h-[10.25rem] w-70">
          {/* User info header */}
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-3 py-1">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={user.image ?? undefined}
                  alt={user.name || "User"}
                />
                <AvatarFallback className="bg-gradient-primary text-base font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-base font-semibold text-gray-900">
                  {user.name || "Uživatel"}
                </span>
                <span className="text-sm text-gray-500">{user.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Menu items */}
          <DropdownMenuItem
            onClick={() => router.push("/dashboard/nastaveni-uzivatele")}
            className="cursor-pointer py-2 text-base"
          >
            <Settings className="mr-2 size-[1.25rem]" />
            <span>Nastavení</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="0 cursor-pointer py-2 text-base disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut className="mr-2 size-[1.25rem]" />
            <span>Odhlásit se</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
