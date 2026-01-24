"use client";

import Link from "next/link";
import { UserButton } from "@/components/user-button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/server/better-auth/client";

export function NavbarInside() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  return (
    <nav className="fixed w-full top-0 right-0 left-0 z-50 border-b bg-white/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-2">
        {/* Logo */}
        <Link
          href={"/"}
          className="bg-gradient-primary bg-clip-text text-2xl sm:text-2xl lg:text-3xl font-bold text-transparent whitespace-nowrap select-none"
        >
          Uživatelský panel
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-6 lg:gap-8 whitespace-nowrap">
          <Link
            href="/dashboard"
            className="text-base lg:text-base xl:text-lg text-gray-700 hover:text-[#E65758] transition-colors font-medium"
          >
            Domů
          </Link>
          <Link
            href="/dashboard/me-certifikaty"
            className="text-base lg:text-base xl:text-lg text-gray-700 hover:text-[#E65758] transition-colors font-medium"
          >
            Mé certifikáty
          </Link>
          <Link
            href="/dashboard/me-sablony"
            className="text-base lg:text-base xl:text-lg text-gray-700 hover:text-[#E65758] transition-colors font-medium"
          >
            Mé šablony
          </Link>
          <Link
            href="/galerie"
            className="text-base lg:text-base xl:text-lg text-gray-700 hover:text-[#E65758] transition-colors font-medium"
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

          <SheetContent side="right" className="w-[300px] flex flex-col">
            <SheetHeader className="mt-3">
              <SheetTitle className="text-2xl font-bold">Menu</SheetTitle>
            </SheetHeader>

            {/* Mobile Navigation Links */}
            <div className="flex flex-col gap-2 mt-6 flex-1">
              <SheetClose asChild>
                <Link
                  href="/dashboard"
                  className="text-lg font-medium text-gray-700 hover:text-[#E65758] hover:bg-red-50 transition-colors py-3 px-4 rounded-lg"
                >
                  Domů
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/dashboard/me-certifikaty"
                  className="text-lg font-medium text-gray-700 hover:text-[#E65758] hover:bg-red-50 transition-colors py-3 px-4 rounded-lg"
                >
                  Mé certifikáty
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/dashboard/me-sablony"
                  className="text-lg font-medium text-gray-700 hover:text-[#E65758] hover:bg-red-50 transition-colors py-3 px-4 rounded-lg"
                >
                  Mé šablony
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/galerie"
                  className="text-lg font-medium text-gray-700 hover:text-[#E65758] hover:bg-red-50 transition-colors py-3 px-4 rounded-lg"
                >
                  Galerie šablon
                </Link>
              </SheetClose>
            </div>

            {/* User Card at Bottom */}
            {user && (
              <SheetClose asChild>
              <div className="mt-auto pt-2 border-t flex justify-center items-center">
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
