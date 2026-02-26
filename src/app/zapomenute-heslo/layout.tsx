import { type Metadata } from "next";

export const metadata: Metadata = {
    title: "Zapomenuté heslo",
};

export default function ZapomenuteHesloLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
