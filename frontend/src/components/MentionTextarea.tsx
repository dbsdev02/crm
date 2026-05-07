import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useMention, type MentionPerson } from "@/hooks/useMention";
import { MentionDropdown } from "./MentionDropdown";

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  people: MentionPerson[];
  rows?: number;
  className?: string;
}

const MentionTextarea = ({ value, onChange, placeholder, people, rows = 3, className }: Props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isOpen, filtered, activeIndex, setActiveIndex, onInputChange, insertMention, handleKeyDown, close, query } = useMention({ people });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    onInputChange(e.target.value, e.target.selectionStart ?? 0);
  };

  const handleSelect = (person: MentionPerson) => {
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const { newValue, newCursor } = insertMention(value, person, cursor);
    onChange(newValue);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => handleKeyDown(e, value, textareaRef.current?.selectionStart ?? 0, ({ newValue, newCursor }) => {
          onChange(newValue);
          setTimeout(() => {
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(newCursor, newCursor);
          }, 0);
        })}
        onBlur={() => setTimeout(close, 150)}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          "flex w-full rounded-xl border border-[#e5e5e5] bg-transparent px-3 py-2 text-[13px] text-[#202020]",
          "placeholder:text-[#ccc] outline-none focus:border-[#db4035] transition-colors resize-none",
          className
        )}
      />
      {isOpen && (
        <MentionDropdown
          people={filtered}
          activeIndex={activeIndex}
          onSelect={handleSelect}
          onMouseEnter={setActiveIndex}
          query={query}
        />
      )}
    </div>
  );
};

export default MentionTextarea;
