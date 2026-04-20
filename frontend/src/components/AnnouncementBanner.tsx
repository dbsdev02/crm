import { useState } from "react";
import { X } from "lucide-react";
import { mockAnnouncements } from "@/data/mockData";

export const AnnouncementBanner = () => {
  const [visible, setVisible] = useState(true);
  const active = mockAnnouncements.filter((a) => a.active);

  if (!visible || active.length === 0) return null;

  return (
    <div className="relative flex items-center overflow-hidden bg-primary text-primary-foreground text-sm h-8">
      <div className="animate-marquee whitespace-nowrap">
        {active.map((a, i) => (
          <span key={a.id} className="mx-8">
            {a.message}
            {i < active.length - 1 && " • "}
          </span>
        ))}
      </div>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-primary-foreground/20"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
