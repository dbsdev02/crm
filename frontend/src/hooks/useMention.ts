import { useState, useRef, useCallback } from "react";

export interface MentionPerson {
  id: string;
  name: string;
  role: string;       // "staff" | "customer" | "admin" etc.
  avatar?: string;
}

interface UseMentionOptions {
  people: MentionPerson[];
}

export function useMention({ people }: UseMentionOptions) {
  const [query, setQuery]           = useState("");
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [activeIndex, setActiveIndex]   = useState(0);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const isOpen = mentionStart !== null;

  const filtered = query.length >= 0
    ? people
        .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)
    : people.slice(0, 8);

  // Call this on every input change
  const onInputChange = useCallback((value: string, cursorPos: number) => {
    const textUpToCursor = value.slice(0, cursorPos);
    const atIdx = textUpToCursor.lastIndexOf("@");

    if (atIdx !== -1) {
      const afterAt = textUpToCursor.slice(atIdx + 1);
      // Only open if no space after @ (still typing the name)
      if (!afterAt.includes(" ") && !afterAt.includes("\n")) {
        setMentionStart(atIdx);
        setQuery(afterAt);
        setActiveIndex(0);
        return;
      }
    }
    setMentionStart(null);
    setQuery("");
  }, []);

  // Insert selected person into value string
  const insertMention = useCallback((
    value: string,
    person: MentionPerson,
    cursorPos: number
  ): { newValue: string; newCursor: number } => {
    if (mentionStart === null) return { newValue: value, newCursor: cursorPos };
    const before = value.slice(0, mentionStart);
    const after  = value.slice(cursorPos);
    const inserted = `@${person.name} `;
    const newValue  = before + inserted + after;
    const newCursor = before.length + inserted.length;
    setMentionStart(null);
    setQuery("");
    return { newValue, newCursor };
  }, [mentionStart]);

  const handleKeyDown = useCallback((
    e: React.KeyboardEvent,
    value: string,
    cursorPos: number,
    onInsert: (result: { newValue: string; newCursor: number }) => void
  ) => {
    if (!isOpen || filtered.length === 0) return false;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      return true;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return true;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      if (filtered[activeIndex]) {
        e.preventDefault();
        onInsert(insertMention(value, filtered[activeIndex], cursorPos));
        return true;
      }
    }
    if (e.key === "Escape") {
      setMentionStart(null);
      setQuery("");
      return true;
    }
    return false;
  }, [isOpen, filtered, activeIndex, insertMention]);

  const close = useCallback(() => {
    setMentionStart(null);
    setQuery("");
  }, []);

  return {
    ref,
    isOpen,
    filtered,
    activeIndex,
    query,
    setActiveIndex,
    onInputChange,
    insertMention,
    handleKeyDown,
    close,
  };
}
