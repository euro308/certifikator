import { type Metadata } from "next";

export const metadata: Metadata = {
    title: "Registrace",
};

export default function RegistraceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
