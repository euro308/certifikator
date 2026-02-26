import { type Metadata } from "next";

export const metadata: Metadata = {
    title: "Přihlášení",
};

export default function PrihlaseniLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
