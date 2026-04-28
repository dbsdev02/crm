import { useRef, useState, useEffect, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface MentionItem {
  id: string;
  name: string;
  type: "staff" | "customer";
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  staff: MentionItem[];
  customers: MentionItem[];
}

const MentionTextarea = ({ value, onChange, placeholder, staff, customers }: Props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState("");
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const allItems: MentionItem[] = [...staff, ...customers];

  const filtered = query.length > 0
    ? allItems.filter((i) => i.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : allItems.slice(0, 8);

  const open = mentionStart !== null;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursor = e.target.selectionStart ?? 0;
    onChange(val);

    // Find last @ before cursor
    const textUpToCursor = val.slice(0, cursor);
    const atIdx = textUpToCursor.lastIndexOf("@");

    if (atIdx !== -1) {
      const afterAt = textUpToCursor.slice(atIdx + 1);
      // Only trigger if no space in the query (single word mention)
      if (!afterAt.includes(" ") && !afterAt.includes("\n")) {
        setMentionStart(atIdx);
        setQuery(afterAt);
        setActiveIndex(0);
        return;
      }
    }
    setMentionStart(null);
    setQuery("");
  };

  const insertMention = (item: MentionItem) => {
    if (mentionStart === null) return;
    const before = value.slice(0, mentionStart);
    const cursor = textareaRef.current?.selectionStart ?? mentionStart + query.length + 1;
    const after = value.slice(cursor);
    const newVal = `${before}@${item.name} ${after}`;
    onChange(newVal);
    setMentionStart(null);
    setQuery("");
    // Restore focus and move cursor after inserted mention
    setTimeout(() => {
      const pos = before.length + item.name.length + 2;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" || e.key === "Tab") {
      if (filtered[activeIndex]) { e.preventDefault(); insertMention(filtered[activeIndex]); }
    } else if (e.key === "Escape") { setMentionStart(null); setQuery(""); }
  };

  // Close on outside click
  useEffect(() => {
    const close = () => { setMentionStart(null); setQuery(""); };
    if (open) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={3}
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
      />
      {open && filtered.length > 0 && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="absolute z-50 left-0 mt-1 w-64 rounded-md border bg-popover shadow-md overflow-hidden"
        >
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b">
            Mention
          </div>
          {filtered.map((item, idx) => (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              onClick={() => insertMention(item)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors",
                idx === activeIndex && "bg-accent"
              )}
            >
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded font-medium",
                item.type === "staff" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
              )}>
                {item.type === "staff" ? "Staff" : "Client"}
              </span>
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionTextarea;
