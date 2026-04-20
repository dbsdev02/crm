import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Customer } from "@/data/mockData";

interface CustomersContextValue {
  customers: Customer[];
  isLoading: boolean;
  addCustomer: (c: Omit<Customer, "id" | "createdAt">) => Promise<Customer>;
  updateCustomer: (id: string, patch: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
}

const CustomersContext = createContext<CustomersContextValue | null>(null);

const toCustomer = (r: any): Customer => ({
  id: String(r.id),
  name: r.name,
  company: r.company,
  email: r.email || "",
  phone: r.phone || "",
  address: r.address || "",
  notes: r.notes || "",
  status: r.status,
  createdAt: r.created_at?.split("T")[0] || "",
});

export const CustomersProvider = ({ children }: { children: ReactNode }) => {
  const qc = useQueryClient();

  const { data: raw = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.get<any[]>("/customers"),
  });

  const customers: Customer[] = raw.map(toCustomer);

  const addMutation = useMutation({
    mutationFn: (c: Omit<Customer, "id" | "createdAt">) => api.post<any>("/customers", c),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Customer> }) =>
      api.put(`/customers/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });

  const addCustomer = async (c: Omit<Customer, "id" | "createdAt">): Promise<Customer> => {
    const res = await addMutation.mutateAsync(c);
    return toCustomer({ ...c, id: res.id, created_at: new Date().toISOString() });
  };

  const updateCustomer = async (id: string, patch: Partial<Customer>) => {
    await updateMutation.mutateAsync({ id, patch });
  };

  const deleteCustomer = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  return (
    <CustomersContext.Provider value={{ customers, isLoading, addCustomer, updateCustomer, deleteCustomer }}>
      {children}
    </CustomersContext.Provider>
  );
};

export const useCustomers = () => {
  const ctx = useContext(CustomersContext);
  if (!ctx) throw new Error("useCustomers must be used within CustomersProvider");
  return ctx;
};
