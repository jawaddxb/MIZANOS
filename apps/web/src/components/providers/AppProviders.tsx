"use client";

import { type ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";

import { TooltipProvider } from "@/components/atoms/feedback/Tooltip";
import { SonnerToaster } from "@/components/atoms/feedback/Sonner";
import { Toaster } from "@/components/providers/Toaster";
import { AuthProvider } from "@/contexts/AuthContext";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

interface AppProvidersProps {
  children: ReactNode;
}

function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange={false}
      >
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <AuthProvider>
            <TooltipProvider>
              {children}
              <Toaster />
              <SonnerToaster />
            </TooltipProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export { AppProviders };
export type { AppProvidersProps };
