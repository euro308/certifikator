import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail certifikátu | Certifikátor",
};

export default function MeCertifikatyDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
