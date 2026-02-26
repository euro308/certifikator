import { type Metadata } from "next";

export const metadata: Metadata = {
    title: "Detail hlášení",
};

export default function AdminNahlaseniDetailLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
