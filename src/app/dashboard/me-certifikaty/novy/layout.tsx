import { type Metadata } from "next";

export const metadata: Metadata = {
    title: "Nový certifikát | Certifikátor",
};

export default function NovyCertifikatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
