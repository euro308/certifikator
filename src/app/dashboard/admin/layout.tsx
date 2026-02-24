// src/app/admin/layout.tsx
import { auth } from "@/server/better-auth/config";
import { headers } from "next/headers";
import React from "react";
import NotFound from "@/app/not-found";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!(session?.user.id == process.env.OFFICIAL_USER_ID)) {
    return <NotFound />;
  }

  return children;
}
