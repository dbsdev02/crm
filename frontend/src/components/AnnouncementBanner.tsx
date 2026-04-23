import { useState } from "react";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const AnnouncementBanner = () => {
  const [visible, setVisible] = useState(true);
  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => api.get<any[]>("/announcements"),
  });

  if (!visible || announcements.length === 0) return null;

  return (
    <div className="relative flex items-center overflow-hidden bg-primary text-primary-foreground text-sm h-8">
      <div className="animate-marquee whitespace-nowrap">
        {announcements.map((a, i) => (
          <span key={a.id} className="mx-8">
            {a.message}
            {i < announcements.length - 1 && " • "}
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
