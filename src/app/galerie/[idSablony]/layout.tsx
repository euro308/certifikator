import { type Metadata } from "next";

export const metadata: Metadata = {
    title: "Detail šablony",
};

export default function GalerieSablonaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
