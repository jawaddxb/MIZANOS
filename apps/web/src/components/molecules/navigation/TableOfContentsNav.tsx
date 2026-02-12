"use client";

import { cn } from "@/lib/utils/cn";

interface TocHeading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsNavProps {
  headings: TocHeading[];
  activeId?: string;
  onSelect?: (id: string) => void;
}

function TableOfContentsNav({ headings, activeId, onSelect }: TableOfContentsNavProps) {
  if (headings.length === 0) return null;

  const handleClick = (id: string) => {
    if (onSelect) {
      onSelect(id);
      return;
    }
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const minLevel = Math.min(...headings.map((h) => h.level));

  return (
    <nav aria-label="Table of contents" className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        On this page
      </p>
      <ul className="space-y-0.5">
        {headings.map((heading) => {
          const indent = heading.level - minLevel;
          return (
            <li key={heading.id}>
              <button
                type="button"
                onClick={() => handleClick(heading.id)}
                className={cn(
                  "block w-full text-left text-sm py-1 border-l-2 transition-colors",
                  "hover:text-foreground hover:border-foreground/30",
                  activeId === heading.id
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-muted-foreground"
                )}
                style={{ paddingLeft: `${0.75 + indent * 0.75}rem` }}
              >
                {heading.text}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { TableOfContentsNav };
export type { TableOfContentsNavProps, TocHeading };
