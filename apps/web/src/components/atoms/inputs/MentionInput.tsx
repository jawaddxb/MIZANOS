"use client";

import { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import { BaseTextarea } from "@/components/atoms/inputs/BaseTextarea";
import type { ProductMember } from "@/lib/types";

export interface MentionInputHandle {
  /** Convert display text (@Name) to storage text (@[profile_id]) */
  toStorageFormat: (text: string) => string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  members: ProductMember[];
  currentUserId?: string;
  placeholder?: string;
  className?: string;
  onSubmit?: () => void;
}

export const MentionInput = forwardRef<MentionInputHandle, MentionInputProps>(
  function MentionInput(
    { value, onChange, members, currentUserId, placeholder = "Write a comment...", className, onSubmit },
    ref,
  ) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [cursorPos, setCursorPos] = useState(0);
    const [mentionStart, setMentionStart] = useState(-1);
    const mentionsMapRef = useRef<Map<string, string>>(new Map());
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      toStorageFormat: (text: string) => {
        let result = text;
        for (const [name, profileId] of mentionsMapRef.current) {
          result = result.replaceAll(`@${name}`, `@[${profileId}]`);
        }
        return result;
      },
    }));

    const filteredMembers = members.filter((m) => {
      const name = m.profile?.full_name ?? m.profile?.email ?? "";
      return name.toLowerCase().includes(searchText.toLowerCase());
    });

    const handleInput = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const pos = e.target.selectionStart ?? 0;
        onChange(newValue);
        setCursorPos(pos);

        const textBefore = newValue.slice(0, pos);
        const atIndex = textBefore.lastIndexOf("@");
        if (atIndex >= 0 && !textBefore.slice(atIndex).includes(" ") && textBefore[atIndex - 1] !== "[") {
          setMentionStart(atIndex);
          setSearchText(textBefore.slice(atIndex + 1));
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
      },
      [onChange],
    );

    const insertMention = useCallback(
      (member: ProductMember) => {
        const name = member.profile?.full_name ?? member.profile?.email ?? "Unknown";
        const before = value.slice(0, mentionStart);
        const after = value.slice(cursorPos);
        const displayMention = `@${name}`;

        mentionsMapRef.current.set(name, member.profile_id);
        onChange(before + displayMention + " " + after);
        setShowSuggestions(false);

        setTimeout(() => {
          if (textareaRef.current) {
            const newPos = before.length + displayMention.length + 1;
            textareaRef.current.selectionStart = newPos;
            textareaRef.current.selectionEnd = newPos;
            textareaRef.current.focus();
          }
        }, 0);
      },
      [value, mentionStart, cursorPos, onChange],
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Escape") setShowSuggestions(false);
      if (e.key === "Enter" && !e.shiftKey && !showSuggestions) {
        e.preventDefault();
        onSubmit?.();
      }
    };

    useEffect(() => {
      const handleClickOutside = () => setShowSuggestions(false);
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    return (
      <div className="relative">
        <BaseTextarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          rows={2}
        />
        {showSuggestions && filteredMembers.length > 0 && (
          <div className="absolute bottom-full left-0 mb-1 w-64 max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md z-50">
            {filteredMembers.map((m) => (
              <button
                key={m.profile_id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(m);
                }}
              >
                {m.profile?.full_name ?? m.profile?.email ?? "Unknown"}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
);
