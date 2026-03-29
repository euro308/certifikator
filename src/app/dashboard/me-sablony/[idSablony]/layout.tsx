import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail šablony | Certifikátor",
};

export default function MeSablonyDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
