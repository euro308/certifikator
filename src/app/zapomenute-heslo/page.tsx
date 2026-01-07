import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export default function ZapomenuteHeslo() {
  return (
    <main className="flex min-h-screen w-screen flex-col items-center justify-center bg-gradient-to-br from-red-50 via-white to-rose-50 px-4 py-12">
      <h1 className="mb-8 text-5xl font-extrabold tracking-tight lg:text-6xl">
        <span className="bg-gradient-primary bg-clip-text text-transparent">
          Certifikátor
        </span>
      </h1>

      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
        <form>
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
              />
            </Field>
          </FieldSet>

          <Button className="bg-gradient-primary mt-6 h-10 w-full text-base font-semibold text-white hover:opacity-90 hover:shadow-lg">
            Odeslat
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
