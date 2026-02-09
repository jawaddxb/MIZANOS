"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { type ReactNode } from "react";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
}

function ThemeProvider({
  children,
  defaultTheme = "light",
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}

export { ThemeProvider, useTheme };
export type { ThemeProviderProps };
