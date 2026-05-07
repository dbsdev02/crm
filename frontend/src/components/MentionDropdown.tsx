import { cn } from "@/lib/utils";
import type { MentionPerson } from "@/hooks/useMention";

const ROLE_STYLE: Record<string, string> = {
  admin:    "bg-red-100 text-red-600",
  staff:    "bg-blue-100 text-blue-600",
  customer: "bg-green-100 text-green-600",
  user:     "bg-purple-100 text-purple-600",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin", staff: "Staff", customer: "Client", user: "Client",
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

interface MentionDropdownProps {
  people: MentionPerson[];
  activeIndex: number;
  onSelect: (person: MentionPerson) => void;
  onMouseEnter: (idx: number) => void;
  query: string;
}

export function MentionDropdown({ people, activeIndex, onSelect, onMouseEnter, query }: MentionDropdownProps) {
  if (people.length === 0) return null;

  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      className="absolute left-0 z-50 mt-1 w-64 bg-white border border-[#e5e5e5] rounded-xl shadow-xl overflow-hidden"
      style={{ bottom: "auto" }}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#f0f0f0]">
        <span className="text-[11px] font-semibold text-[#aaa] uppercase tracking-wider">
          {query ? `"${query}"` : "People"}
        </span>
        <span className="text-[10px] text-[#ccc] ml-auto">↑↓ navigate · Enter select</span>
      </div>

      {/* List */}
      <div className="max-h-52 overflow-y-auto">
        {people.map((person, idx) => (
          <button
            key={`${person.role}-${person.id}`}
            type="button"
            onMouseEnter={() => onMouseEnter(idx)}
            onClick={() => onSelect(person)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
              idx === activeIndex ? "bg-[#f5f5f5]" : "hover:bg-[#fafafa]"
            )}
          >
            {/* Avatar */}
            <div className={cn(
              "h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
              ROLE_STYLE[person.role] || "bg-gray-100 text-gray-600"
            )}>
              {person.avatar
                ? <img src={person.avatar} alt={person.name} className="h-7 w-7 rounded-full object-cover" />
                : initials(person.name)
              }
            </div>

            {/* Name + role */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[#202020] truncate">
                {highlightMatch(person.name, query)}
              </p>
            </div>

            {/* Role badge */}
            <span className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0",
              ROLE_STYLE[person.role] || "bg-gray-100 text-gray-500"
            )}>
              {ROLE_LABEL[person.role] || person.role}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Highlight matching query in name
function highlightMatch(name: string, query: string) {
  if (!query) return <>{name}</>;
  const idx = name.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{name}</>;
  return (
    <>
      {name.slice(0, idx)}
      <mark className="bg-yellow-100 text-[#202020] rounded-sm px-0">{name.slice(idx, idx + query.length)}</mark>
      {name.slice(idx + query.length)}
    </>
  );
}
