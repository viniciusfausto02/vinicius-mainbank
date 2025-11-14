"use client";

import React from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SessionProvider } from "next-auth/react";

// This component is a small client-only wrapper used inside
// the (server) RootLayout. It ensures that every page and component
// rendered under it has access to the LanguageContext.
export function LanguageRoot({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </SessionProvider>
  );
}
