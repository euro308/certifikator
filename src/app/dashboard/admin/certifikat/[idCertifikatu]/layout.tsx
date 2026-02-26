import { type Metadata } from "next";

export const metadata: Metadata = {
    title: "Detail certifikátu",
};

export default function AdminCertifikatDetailLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
