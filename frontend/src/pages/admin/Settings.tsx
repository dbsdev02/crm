import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Globe, Mail, Key, HardDrive, Shield, Palette, Save, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const sections = [
  { id: "branding",  label: "Branding",     icon: Palette },
  { id: "smtp",      label: "SMTP / Email", icon: Mail },
  { id: "api",       label: "API Keys",     icon: Key },
  { id: "storage",   label: "Storage",      icon: HardDrive },
  { id: "security",  label: "Security",     icon: Shield },
  { id: "domain",    label: "Domain & URLs",icon: Globe },
];

export default function AdminSettings() {
  const [active, setActive] = useState("branding");
  const [showPass, setShowPass] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const { data: settings = {}, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => api.get<Record<string, string>>("/admin/settings"),
    onSuccess: (d: Record<string, string>) => setForm(d),
  } as any);

  const merged = { ...settings, ...form };

  const saveMutation = useMutation({
    mutationFn: () => api.put("/admin/settings", form),
    onSuccess: () => toast({ title: "Settings saved" }),
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const Field = ({ label, k, type = "text", placeholder = "" }: { label: string; k: string; type?: string; placeholder?: string }) => (
    <div>
      <label className="text-[12px] font-medium text-[#555] block mb-1.5">{label}</label>
      <input type={type} value={merged[k] ?? ""} onChange={e => set(k, e.target.value)} placeholder={placeholder}
        className="w-full h-9 px-3 text-[13px] bg-[#f5f5f5] rounded-lg border border-transparent focus:outline-none focus:border-[#e0e0e0] focus:bg-white transition-all placeholder:text-[#bbb]" />
    </div>
  );

  const Toggle = ({ label, desc, k }: { label: string; desc: string; k: string }) => {
    const on = merged[k] === "true";
    return (
      <div className="flex items-center justify-between p-4 bg-[#fafafa] rounded-xl border border-[#f0f0f0]">
        <div>
          <p className="text-[13px] font-medium text-[#0f0f0f]">{label}</p>
          <p className="text-[12px] text-[#888] mt-0.5">{desc}</p>
        </div>
        <button onClick={() => set(k, on ? "false" : "true")}
          className={cn("relative w-10 h-5 rounded-full transition-colors shrink-0", on ? "bg-[#0f0f0f]" : "bg-[#e0e0e0]")}>
          <motion.span animate={{ x: on ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-0.5 size-4 rounded-full bg-white shadow-sm" />
        </button>
      </div>
    );
  };

  const sectionContent: Record<string, React.ReactNode> = {
    branding: (
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="App Name"      k="app_name" />
          <Field label="Support Email" k="support_email" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[12px] font-medium text-[#555] block mb-1.5">Primary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={merged.primary_color ?? "#db4035"} onChange={e => set("primary_color", e.target.value)}
                className="h-9 w-12 rounded-lg border border-[#e0e0e0] cursor-pointer p-0.5" />
              <input value={merged.primary_color ?? "#db4035"} onChange={e => set("primary_color", e.target.value)}
                className="flex-1 h-9 px-3 text-[13px] bg-[#f5f5f5] rounded-lg border border-transparent focus:outline-none focus:border-[#e0e0e0] focus:bg-white transition-all font-mono" />
            </div>
          </div>
        </div>
      </div>
    ),
    smtp: (
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="SMTP Host" k="smtp_host" placeholder="smtp.sendgrid.net" />
          <Field label="Port"      k="smtp_port" placeholder="587" />
          <Field label="Username"  k="smtp_user" placeholder="apikey" />
          <div>
            <label className="text-[12px] font-medium text-[#555] block mb-1.5">Password</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={merged.smtp_pass ?? ""} onChange={e => set("smtp_pass", e.target.value)}
                className="w-full h-9 px-3 pr-9 text-[13px] bg-[#f5f5f5] rounded-lg border border-transparent focus:outline-none focus:border-[#e0e0e0] focus:bg-white transition-all" />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555]">
                {showPass ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    ),
    api: (
      <div className="space-y-3">
        <div className="p-4 bg-[#fafafa] rounded-xl border border-[#f0f0f0]">
          <p className="text-[13px] font-medium text-[#0f0f0f] mb-2">JWT Secret</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[12px] font-mono text-[#555] bg-white border border-[#e8e8e8] rounded-lg px-3 py-2 truncate">
              {showKey ? (merged.jwt_secret ?? "Not configured") : "••••••••••••••••••••••••••••••••"}
            </code>
            <button onClick={() => setShowKey(!showKey)} className="p-2 rounded-lg hover:bg-[#f0f0f0] text-[#aaa] hover:text-[#555] transition-colors">
              {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
        </div>
        <p className="text-[12px] text-[#888]">API keys are managed via environment variables on the server.</p>
      </div>
    ),
    storage: (
      <div className="space-y-4">
        <p className="text-[13px] text-[#888]">Storage metrics are calculated from the database and file system.</p>
        {[
          { label: "Database",   value: 12, max: 100 },
          { label: "Uploads",    value: 34, max: 100 },
        ].map(item => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] text-[#333]">{item.label}</span>
              <span className="text-[12px] font-medium text-[#555]">{item.value}%</span>
            </div>
            <div className="h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ duration: 0.6 }}
                className="h-full bg-emerald-400 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    ),
    security: (
      <div className="space-y-4">
        <Toggle label="Require MFA for all admins" desc="Enforce two-factor authentication for admin accounts" k="mfa_required" />
        <Toggle label="Enable SSO / SAML"          desc="Allow organizations to use their own identity provider" k="sso_enabled" />
        <Toggle label="IP Whitelist"               desc="Restrict admin panel access to specific IP ranges" k="ip_whitelist" />
      </div>
    ),
    domain: (
      <div className="space-y-4">
        <Field label="Frontend URL"  k="frontend_url"  placeholder="https://app.internal.ltd" />
        <Field label="Backend URL"   k="backend_url"   placeholder="https://internal.ltd/backend" />
      </div>
    ),
  };

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="grid lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl border border-[#f0f0f0] p-3 shadow-sm space-y-1 h-fit">
          {sections.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActive(id)}
              className={cn("flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors",
                active === id ? "bg-[#0f0f0f] text-white" : "text-[#555] hover:bg-[#f5f5f5]")}>
              <Icon className="size-4 shrink-0" /> {label}
            </button>
          ))}
        </motion.div>

        <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
          className="lg:col-span-3 bg-white rounded-2xl border border-[#f0f0f0] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[15px] font-semibold text-[#0f0f0f]">{sections.find(s => s.id === active)?.label}</h3>
            <button onClick={() => saveMutation.mutate()}
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-white bg-[#0f0f0f] rounded-lg hover:bg-[#333] transition-colors">
              <Save className="size-3.5" /> Save Changes
            </button>
          </div>
          {isLoading ? <Skeleton className="h-40 rounded-xl" /> : sectionContent[active]}
        </motion.div>
      </div>
    </div>
  );
}
