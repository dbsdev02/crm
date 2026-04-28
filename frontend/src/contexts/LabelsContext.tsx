import { createContext, useContext, useState, ReactNode } from "react";

interface LabelsContextType {
  labels: string[];
  addLabel: (l: string) => void;
  removeLabel: (l: string) => void;
  activeFilter: string | null;
  setActiveFilter: (l: string | null) => void;
}

const LabelsContext = createContext<LabelsContextType | null>(null);

const DEFAULT_LABELS = ["bug", "feature", "design", "urgent", "review"];

export const LabelsProvider = ({ children }: { children: ReactNode }) => {
  const [labels, setLabels] = useState<string[]>(DEFAULT_LABELS);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const addLabel = (l: string) => {
    const val = l.trim().toLowerCase();
    if (val && !labels.includes(val)) setLabels((prev) => [...prev, val]);
  };

  const removeLabel = (l: string) => {
    setLabels((prev) => prev.filter((x) => x !== l));
    if (activeFilter === l) setActiveFilter(null);
  };

  return (
    <LabelsContext.Provider value={{ labels, addLabel, removeLabel, activeFilter, setActiveFilter }}>
      {children}
    </LabelsContext.Provider>
  );
};

export const useLabels = () => {
  const ctx = useContext(LabelsContext);
  if (!ctx) throw new Error("useLabels must be used within LabelsProvider");
  return ctx;
};
