"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { authClient } from "@/server/better-auth/client";
import { TRPCReactProvider } from "@/trpc/react";

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <TRPCReactProvider>
      <AuthUIProvider
        authClient={authClient}
        navigate={(to) => router.push(to)}
        replace={(to) => router.replace(to)}
        onSessionChange={() => {
          router.refresh();
        }}
        Link={Link}
      >
        {children}
      </AuthUIProvider>
    </TRPCReactProvider>
  );
}
