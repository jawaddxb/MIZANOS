"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { SkillTag } from "@/components/atoms/display/SkillTag";

interface SkillFilterProps {
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  availableSkills: string[];
}

export function SkillFilter({
  selectedSkills,
  onSkillsChange,
  availableSkills,
}: SkillFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unselected = availableSkills.filter(
    (s) =>
      !selectedSkills.includes(s) &&
      s.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = (skill: string) => {
    onSkillsChange([...selectedSkills, skill]);
    setSearch("");
  };

  const handleRemove = (skill: string) => {
    onSkillsChange(selectedSkills.filter((s) => s !== skill));
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-9 rounded-md border bg-background px-3 text-sm min-w-[160px]"
      >
        <span className="text-muted-foreground">
          {selectedSkills.length > 0
            ? `${selectedSkills.length} skill${selectedSkills.length > 1 ? "s" : ""}`
            : "Filter by skills"}
        </span>
        <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
      </button>

      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedSkills.map((skill) => (
            <SkillTag
              key={skill}
              skill={skill}
              onRemove={() => handleRemove(skill)}
            />
          ))}
        </div>
      )}

      {isOpen && (
        <div className="absolute z-50 top-10 left-0 w-56 rounded-md border bg-popover shadow-md">
          <div className="p-2">
            <input
              placeholder="Search skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 rounded-md border bg-background px-2 text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto px-1 pb-1">
            {unselected.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground text-center">
                No skills found
              </p>
            ) : (
              unselected.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleAdd(skill)}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent"
                >
                  {skill}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
