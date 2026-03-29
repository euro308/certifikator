import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Obnovit heslo",
};

export default function ObnovitHesloLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
