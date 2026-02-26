import { type Metadata } from "next";

export const metadata: Metadata = {
    title: "Nastavení uživatele",
};

export default function NastaveniUzivateleLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
