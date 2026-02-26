import { type Metadata } from "next";

export const metadata: Metadata = {
    title: "Úprava šablony | Certifikátor",
};

export default function MeSablonyUpravitLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
