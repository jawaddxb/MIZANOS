"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils/cn";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/feedback/Tooltip";

interface ThemeToggleProps {
  className?: string;
}

function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <BaseButton
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className={cn(
            "h-8 w-8 hover:bg-secondary transition-colors",
            className,
          )}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </BaseButton>
      </TooltipTrigger>
      <TooltipContent>
        {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      </TooltipContent>
    </Tooltip>
  );
}

export { ThemeToggle };
