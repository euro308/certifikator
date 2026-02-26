import { type Metadata } from "next";

export const metadata: Metadata = {
    title: "Nová šablona | Certifikátor",
};

export default function NovaSablonaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
