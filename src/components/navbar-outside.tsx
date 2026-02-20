import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export function NavbarOutside() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href={"/"} className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Certifikátor
        </Link>

        {/* Desktop menu - skrytý na mobilu */}
        <div className="hidden md:flex gap-2 bg-white">
          <Button variant="ghost" className="hover:bg-red-50">
            <Link href={"/funkce"}>Funkce</Link>
          </Button>
          <Button variant="ghost" className="hover:bg-red-50">
            <Link href={"/o-projektu"}>O projektu</Link>
          </Button>
          <Button variant="ghost" className="hover:bg-red-50">
            <Link href={"/galerie"}>Galerie šablon</Link>
          </Button>
          <Button variant="ghost" className="hover:bg-red-50">
            <Link href="/kontrola-platnosti">Kontrola platnosti</Link>
          </Button>
        </div>

        {/* Mobile menu burger - viditelný jen na mobilu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="h-10 w-10 border-2">
              <Menu className={"size-6"} strokeWidth={3} />
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-[300px]">
            <SheetHeader className="mt-3">
              <SheetTitle className="text-2xl">Menu</SheetTitle>
            </SheetHeader>

            {/* Mobile menu items */}
            <div className="flex flex-col gap-2 mt-6 flex-1">
              <SheetClose asChild>
              </SheetClose>
              <SheetClose asChild>
                <Link href="/funkce" className="text-lg font-medium hover:text-[#E65758] transition-colors py-3 px-4 hover:bg-red-50 rounded-lg">
                  Funkce
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link href="/o-projektu" className="text-lg font-medium hover:text-[#E65758] transition-colors py-3 px-4 hover:bg-red-50 rounded-lg">
                  O nás
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link href="/galerie" className="text-lg font-medium hover:text-[#E65758] transition-colors py-3 px-4 hover:bg-red-50 rounded-lg">
                  Galerie šablon
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link href="/kontrola-platnosti" className="text-lg font-medium hover:text-[#E65758] transition-colors py-3 px-4 hover:bg-red-50 rounded-lg">
                  Kontrola platnosti
                </Link>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
