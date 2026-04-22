import { createContext, useContext, useState, ReactNode } from "react";

export type FieldType = "text" | "number" | "email" | "tel" | "date" | "select" | "textarea";

export interface BuiltInFieldConfig {
  key: "name" | "company" | "email" | "phone" | "value" | "stage";
  label: string;
  enabled: boolean;
  required: boolean;
  locked?: boolean; // cannot be disabled (e.g. name)
}

export interface CustomFieldConfig {
  id: string;
  key: string; // safe key derived from label
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[]; // for select
}

interface LeadFieldsContextValue {
  builtIn: BuiltInFieldConfig[];
  custom: CustomFieldConfig[];
  toggleBuiltIn: (key: BuiltInFieldConfig["key"]) => void;
  toggleBuiltInRequired: (key: BuiltInFieldConfig["key"]) => void;
  addCustom: (field: Omit<CustomFieldConfig, "id" | "key">) => void;
  removeCustom: (id: string) => void;
  updateCustom: (id: string, patch: Partial<CustomFieldConfig>) => void;
}

const defaultBuiltIn: BuiltInFieldConfig[] = [
  { key: "name", label: "Name", enabled: true, required: true, locked: true },
  { key: "company", label: "Company", enabled: true, required: true },
  { key: "email", label: "Email", enabled: true, required: false },
  { key: "phone", label: "Phone", enabled: true, required: false },
  { key: "value", label: "Value (₹)", enabled: true, required: false },
  { key: "stage", label: "Stage", enabled: true, required: true, locked: true },
];

const LeadFieldsContext = createContext<LeadFieldsContextValue | null>(null);

const slugify = (s: string) =>
  "cf_" + s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export const LeadFieldsProvider = ({ children }: { children: ReactNode }) => {
  const [builtIn, setBuiltIn] = useState<BuiltInFieldConfig[]>(defaultBuiltIn);
  const [custom, setCustom] = useState<CustomFieldConfig[]>([]);

  const toggleBuiltIn = (key: BuiltInFieldConfig["key"]) =>
    setBuiltIn((prev) =>
      prev.map((f) => (f.key === key && !f.locked ? { ...f, enabled: !f.enabled } : f))
    );

  const toggleBuiltInRequired = (key: BuiltInFieldConfig["key"]) =>
    setBuiltIn((prev) =>
      prev.map((f) => (f.key === key && !f.locked ? { ...f, required: !f.required } : f))
    );

  const addCustom = (field: Omit<CustomFieldConfig, "id" | "key">) => {
    const id = `cf_${Date.now()}`;
    setCustom((prev) => [
      ...prev,
      { ...field, id, key: slugify(field.label) || id },
    ]);
  };

  const removeCustom = (id: string) =>
    setCustom((prev) => prev.filter((f) => f.id !== id));

  const updateCustom = (id: string, patch: Partial<CustomFieldConfig>) =>
    setCustom((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  return (
    <LeadFieldsContext.Provider
      value={{ builtIn, custom, toggleBuiltIn, toggleBuiltInRequired, addCustom, removeCustom, updateCustom }}
    >
      {children}
    </LeadFieldsContext.Provider>
  );
};

export const useLeadFields = () => {
  const ctx = useContext(LeadFieldsContext);
  if (!ctx) throw new Error("useLeadFields must be used within LeadFieldsProvider");
  return ctx;
};
