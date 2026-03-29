import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Mé certifikáty",
};

export default function MeCertifikatyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
