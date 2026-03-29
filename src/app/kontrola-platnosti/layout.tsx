import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontrola platnosti",
};

export default function KontrolaPlatnostiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
