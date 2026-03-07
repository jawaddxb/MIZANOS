"use client";

import { useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Command } from "cmdk";
import { cn } from "@/lib/utils/cn";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/layout/Popover";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  triggerClassName?: string;
  icon?: React.ReactNode;
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  triggerClassName,
  icon,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()),
      )
    : options;

  const selectedLabel = options.find((o) => o.value === value)?.label;

  const handleSelect = (val: string) => {
    onValueChange(val);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            triggerClassName,
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {icon}
            <span className="truncate">
              {selectedLabel ?? placeholder}
            </span>
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-[200px] p-0"
        align="start"
      >
        <Command className="rounded-md border-0" shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Search..."
              value={search}
              onValueChange={setSearch}
              className="flex h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="max-h-[280px] overflow-y-auto p-1">
            {filtered.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No results found.
              </p>
            )}
            {filtered.map((option) => (
              <Command.Item
                key={option.value}
                value={option.value}
                onSelect={() => handleSelect(option.value)}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent data-[selected=true]:bg-accent"
              >
                <Check
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    value === option.value ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="truncate">{option.label}</span>
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
