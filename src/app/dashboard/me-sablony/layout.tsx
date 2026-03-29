import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Mé šablony",
};

export default function MeSablonyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
