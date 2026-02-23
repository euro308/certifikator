"use client";

import Link from "next/link";
import { UserButton } from "@/components/user/user-button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/server/better-auth/client";

export function NavbarInside() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-2">
        {/* Logo */}
        <Link
          href={"/public"}
          className="bg-gradient-primary bg-clip-text text-2xl font-bold whitespace-nowrap text-transparent select-none sm:text-2xl lg:text-3xl"
        >
          Uživatelský panel
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 whitespace-nowrap lg:flex lg:gap-8">
          <Link
            href="/dashboard"
            className="text-base font-medium text-gray-700 transition-colors hover:text-[#E65758] lg:text-base xl:text-lg"
          >
            Domů
          </Link>
          <Link
            href="/dashboard/me-certifikaty"
            className="text-base font-medium text-gray-700 transition-colors hover:text-[#E65758] lg:text-base xl:text-lg"
          >
            Mé certifikáty
          </Link>
          <Link
            href="/dashboard/me-sablony"
            className="text-base font-medium text-gray-700 transition-colors hover:text-[#E65758] lg:text-base xl:text-lg"
          >
            Mé šablony
          </Link>
          <Link
            href="/galerie"
            className="text-base font-medium text-gray-700 transition-colors hover:text-[#E65758] lg:text-base xl:text-lg"
          >
            Galerie šablon
          </Link>
        </div>

        {/* Desktop User Button */}
        <div className="hidden lg:block">
          <UserButton />
        </div>

        {/* Mobile Burger Menu */}
        <Sheet>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="flex w-[300px] flex-col">
            <SheetHeader className="mt-3">
              <SheetTitle className="text-2xl font-bold">Menu</SheetTitle>
            </SheetHeader>

            {/* Mobile Navigation Links */}
            <div className="mt-6 flex flex-1 flex-col gap-2">
              <SheetClose asChild>
                <Link
                  href="/dashboard"
                  className="rounded-lg px-4 py-3 text-lg font-medium text-gray-700 transition-colors hover:bg-red-50 hover:text-[#E65758]"
                >
                  Domů
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/dashboard/me-certifikaty"
                  className="rounded-lg px-4 py-3 text-lg font-medium text-gray-700 transition-colors hover:bg-red-50 hover:text-[#E65758]"
                >
                  Mé certifikáty
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/dashboard/me-sablony"
                  className="rounded-lg px-4 py-3 text-lg font-medium text-gray-700 transition-colors hover:bg-red-50 hover:text-[#E65758]"
                >
                  Mé šablony
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/galerie"
                  className="rounded-lg px-4 py-3 text-lg font-medium text-gray-700 transition-colors hover:bg-red-50 hover:text-[#E65758]"
                >
                  Galerie šablon
                </Link>
              </SheetClose>
            </div>

            {/* User Card at Bottom */}
            {user && (
              <SheetClose asChild>
                <div className="mt-auto flex items-center justify-center border-t pt-2">
                  <UserButton />
                </div>
              </SheetClose>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
