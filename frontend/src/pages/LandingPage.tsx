import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu, X, Zap, ArrowRight, Check, ChevronRight,
  Users, BarChart2, Target, CheckSquare, Bell, Calendar,
  PhoneCall, MessageSquare, Shield, Star,
} from "lucide-react";

const NAV_LINKS = ["Features", "How It Works", "Pricing", "Demo"];

const PIPELINE_TOOLS = [
  { icon: Target, label: "Capture Leads" },
  { icon: Users, label: "Qualify Prospects" },
  { icon: CheckSquare, label: "Track Tasks" },
  { icon: BarChart2, label: "Close Deals" },
];

const AGENT_FEATURES = [
  "Makes outbound calls to fresh leads",
  "Sends follow-up messages with information",
  "Shares information about business, products and services",
  "Qualifies leads based on the conversation",
  "Updates CRM with lead status, tags and AI summary",
  "Assigns leads to human team members",
];

const CONVERSION_SECTIONS = [
  {
    tag: "Faster response, 2X conversions.",
    points: [
      "AI Sales Agent works 24/7 across calls, chats and emails",
      "Instantly follows up with every lead within seconds",
      "Handles multiple leads simultaneously",
      "Never lets a hot lead slip away",
    ],
    bg: "bg-white",
  },
  {
    tag: "Convert more without hiring more.",
    points: [
      "A single AI agent can handle 100s of leads",
      "Filters out low-intent leads",
      "Your team focuses on ready-to-buy leads & closing",
      "Scale your outreach without scaling your team",
    ],
    bg: "bg-[#f7f9ff]",
  },
  {
    tag: "Single platform. Zero chaos.",
    points: [
      "One dashboard for every lead, task and conversation",
      "Leads automatically assigned to the right team",
      "Full conversation history on every lead",
      "No duplicate entries or missed follow-ups",
    ],
    bg: "bg-white",
  },
  {
    tag: "Pay less for more.",
    points: [
      "No additional devices or hardware needed",
      "Works on any existing device or browser",
      "Always get working solutions at all times",
      "Simple fair pricing — no hidden charges",
    ],
    bg: "bg-[#f7f9ff]",
  },
  {
    tag: "Full Visibility. Total Control.",
    points: [
      "Track all activity of all leads",
      "Complete tracking of all tasks",
      "Real-time reports on team performance",
      "Free instant access and real-time tracking",
    ],
    bg: "bg-white",
  },
];

const COMPARE_ROWS = [
  { feature: "Lead Management", others: true, us: true },
  { feature: "Task Management", others: true, us: true },
  { feature: "AI Sales Agent", others: false, us: true },
  { feature: "Built-in Telephony", others: false, us: true },
  { feature: "WhatsApp Integration", others: false, us: true },
  { feature: "Automation", others: false, us: true },
  { feature: "Price per user", others: "₹3,000+", us: "₹999" },
];

const LOGOS = ["ZEET", "Kice", "NexaGroup", "TechCorp", "GrowthLabs", "BrandX"];

const BILLING_TABS = ["Monthly", "Quarterly", "Yearly"] as const;
type BillingTab = typeof BILLING_TABS[number];

const PLAN_PRICES: Record<BillingTab, { price: string; period: string; badge?: string }[]> = {
  Monthly: [
    { price: "₹999",   period: "/user/month" },
    { price: "₹2,499", period: "/month" },
    { price: "Custom", period: "" },
  ],
  Quarterly: [
    { price: "₹799",   period: "/user/month", badge: "Save 20%" },
    { price: "₹1,999", period: "/month",      badge: "Save 20%" },
    { price: "Custom", period: "" },
  ],
  Yearly: [
    { price: "₹2,499", period: "/user/year",  badge: "Best Value" },
    { price: "₹5,999", period: "/year",        badge: "Best Value" },
    { price: "Custom", period: "" },
  ],
};

const PLANS = [
  {
    name: "All-in-One CRM",
    features: ["Unlimited leads", "Task management", "Reports & analytics", "Push notifications", "Email support"],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "AI Agents",
    features: ["Everything in CRM", "AI Sales Agent", "Auto follow-ups", "Lead qualification", "Priority support"],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Biz Line",
    features: ["Everything in AI", "Dedicated number", "Call recording", "Custom integrations", "Dedicated manager"],
    cta: "Contact Sales",
    highlight: false,
  },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [billing, setBilling] = useState<BillingTab>("Monthly");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-['Inter',sans-serif] text-[#1a1a2e]">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#eef0f5]">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#db4035] flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-[16px] font-bold text-[#1a1a2e]">Internal</span>
          </div>

          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                className="text-[13px] text-[#555] hover:text-[#db4035] transition-colors">
                {l}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => navigate("/login")}
              className="text-[13px] text-[#555] hover:text-[#db4035] px-4 py-2 transition-colors">
              Contact Us
            </button>
            <button onClick={() => navigate("/login")}
              className="text-[13px] font-semibold bg-[#db4035] text-white px-4 py-2 rounded-lg hover:bg-[#c0392b] transition-colors">
              Plans & Pricing
            </button>
          </div>

          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-[#eef0f5] bg-white px-5 py-4 space-y-3">
            {NAV_LINKS.map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                onClick={() => setMenuOpen(false)}
                className="block text-[13px] text-[#555] py-1">{l}</a>
            ))}
            <button onClick={() => navigate("/login")}
              className="w-full mt-2 text-[13px] font-semibold bg-[#db4035] text-white px-4 py-2.5 rounded-lg">
              Get Started Free
            </button>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-b from-red-50 to-white pt-16 pb-20 px-5 text-center">
        <p className="text-[13px] text-[#db4035] font-semibold mb-2">India's only All-in-One CRM</p>
        <p className="text-[11px] text-[#888] -mt-1 mb-1">by Internal</p>
        <h1 className="text-[38px] md:text-[52px] font-extrabold text-[#1a1a2e] leading-[1.15] mb-3 tracking-tight">
          CRM + Telephony + WhatsApp API
        </h1>
        <div className="inline-flex items-center gap-2 bg-[#fef9c3] border border-[#fde047] text-[#854d0e] text-[12px] font-bold px-4 py-1.5 rounded-full mb-6">
          <Zap className="h-3.5 w-3.5" /> AI SALES AGENTS
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2">
          <button onClick={() => navigate("/login")}
            className="flex items-center gap-2 bg-[#db4035] text-white text-[14px] font-semibold px-6 py-3 rounded-xl hover:bg-[#c0392b] transition-all shadow-lg shadow-red-200">
            Book a Demo <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* ── From Lead to Conversion ── */}
      <section className="py-16 px-5 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-[26px] md:text-[32px] font-extrabold text-[#1a1a2e] mb-2">
            From lead to conversion —{" "}
            <span className="text-[#db4035]">all inside one system</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-6 mt-10">
            {PIPELINE_TOOLS.map((t) => (
              <div key={t.label} className="flex flex-col items-center gap-2">
                <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center">
                  <t.icon className="h-6 w-6 text-[#db4035]" />
                </div>
                <span className="text-[12px] font-semibold text-[#444]">{t.label}</span>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-[#888] mt-8">
            ✦ The power of 5 tools unified into one seamless platform ✦
          </p>
          <div className="flex flex-wrap justify-center gap-6 mt-4 text-[12px] text-[#666]">
            {["Sales CRM", "Telephony", "CRM", "Automation", "WhatsApp API"].map((t) => (
              <span key={t} className="bg-red-50 px-3 py-1 rounded-full border border-red-100">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Sales Agent ── */}
      <section className="py-16 px-5 bg-[#f7f9ff]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-[26px] md:text-[32px] font-extrabold text-[#1a1a2e]">
              Internal AI Sales Agent works like a{" "}
              <span className="text-[#db4035]">fully functional sales employee</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {AGENT_FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-[#db4035] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-[14px] text-[#444]">{f}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-[13px] font-semibold text-[#db4035] mt-8">
            100% Reliable. 100% Consistent. 100% Available
          </p>
        </div>
      </section>

      {/* ── Pick an AI Agent ── */}
      <section className="py-16 px-5 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-[24px] md:text-[30px] font-extrabold text-[#1a1a2e] mb-2">
            Pick an AI Agent that fits your sales process
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-10 max-w-2xl mx-auto">
            {[
              { name: "Faster", role: "Outbound Caller", color: "bg-red-50 border-red-200" },
              { name: "Smarter", role: "Lead Qualifier", color: "bg-orange-50 border-orange-200" },
            ].map((a) => (
              <div key={a.name} className={`rounded-2xl border p-6 text-left ${a.color}`}>
                <div className="h-12 w-12 rounded-full bg-[#db4035] flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <p className="text-[18px] font-bold text-[#1a1a2e]">{a.name}</p>
                <p className="text-[13px] text-[#666] mt-1">{a.role}</p>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/login")}
            className="mt-8 inline-flex items-center gap-2 bg-[#db4035] text-white text-[14px] font-semibold px-6 py-3 rounded-xl hover:bg-[#c0392b] transition-all">
            Try AI Agent for Free <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* ── Conversion Sections ── */}
      <section id="features">
        <div className="text-center py-12 px-5 bg-[#f7f9ff]">
          <h2 className="text-[26px] md:text-[34px] font-extrabold text-[#1a1a2e]">
            Internal is built for one thing:{" "}
            <span className="text-[#db4035]">More Conversions</span>
          </h2>
        </div>
        {CONVERSION_SECTIONS.map((s) => (
          <div key={s.tag} className={`py-14 px-5 ${s.bg}`}>
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h3 className="text-[20px] md:text-[24px] font-extrabold text-[#1a1a2e] mb-5">{s.tag}</h3>
                <ul className="space-y-3">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-[#db4035] shrink-0 mt-0.5" />
                      <span className="text-[14px] text-[#555]">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-sm">
                <div className="space-y-2">
                  {[70, 50, 85, 60].map((w, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-2 rounded-full bg-[#db4035]/20 flex-1">
                        <div className="h-2 rounded-full bg-[#db4035]" style={{ width: `${w}%` }} />
                      </div>
                      <span className="text-[11px] text-[#888] w-8">{w}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Why Pay for 3 Tools ── */}
      <section className="py-16 px-5 bg-[#f7f9ff]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-[24px] md:text-[30px] font-extrabold text-[#1a1a2e]">
              Why pay for 3 tools when{" "}
              <span className="text-[#db4035]">I does it all</span>
            </h2>
            <p className="text-[13px] text-[#888] mt-2">Compare the cost of your sales tools with Internal</p>
          </div>
          <div className="bg-white rounded-2xl border border-red-100 overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 bg-[#1a1a2e] text-white text-[13px] font-semibold">
              <div className="p-4">Feature</div>
              <div className="p-4 text-center">3 Separate Tools</div>
              <div className="p-4 text-center text-red-300">Internal All-in-One</div>
            </div>
            {COMPARE_ROWS.map((r, i) => (
              <div key={r.feature} className={`grid grid-cols-3 text-[13px] border-t border-[#f0f0f0] ${i % 2 === 0 ? "bg-white" : "bg-red-50/30"}`}>
                <div className="p-4 text-[#444] font-medium">{r.feature}</div>
                <div className="p-4 text-center">
                  {typeof r.others === "boolean"
                    ? r.others ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-red-400 mx-auto" />
                    : <span className="text-[#888]">{r.others}</span>}
                </div>
                <div className="p-4 text-center">
                  {typeof r.us === "boolean"
                    ? <Check className="h-4 w-4 text-[#db4035] mx-auto" />
                    : <span className="text-[#db4035] font-bold">{r.us}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="py-14 px-5 bg-white text-center">
        <h2 className="text-[22px] font-extrabold text-[#1a1a2e] mb-2">
          Join 10,000+ growing businesses using Internal
        </h2>
        <p className="text-[13px] text-[#888] mb-8">
          Trusted by business owners across all industries for sales and customer service.
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          {LOGOS.map((l) => (
            <div key={l} className="bg-red-50 border border-red-100 rounded-xl px-5 py-2.5 text-[13px] font-bold text-[#555]">
              {l}
            </div>
          ))}
        </div>
      </section>

      {/* ── Live Demo CTA ── */}
      <section id="demo" className="py-16 px-5 bg-[#fef9c3]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-[24px] md:text-[30px] font-extrabold text-[#1a1a2e] mb-2">
            Get a LIVE demo
          </h2>
          <p className="text-[14px] text-[#666] mb-6">
            Our sales team will give all features of Internal on a Google Meet
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-[13px] text-[#444] mb-8">
            {["See all features live", "Ask any questions", "Get custom pricing", "No commitment needed"].map((f) => (
              <div key={f} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#db4035]" /> {f}
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/login")}
            className="inline-flex items-center gap-2 bg-[#db4035] text-white text-[14px] font-semibold px-7 py-3 rounded-xl hover:bg-[#c0392b] transition-all shadow-lg shadow-red-200">
            Book a Demo <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-[12px] text-[#888] mt-3">Get 50% off on your 1st plan!</p>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-16 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-[24px] md:text-[30px] font-extrabold text-[#1a1a2e]">
              Simple pricing based on your business needs
            </h2>
            {/* Billing toggle */}
            <div className="inline-flex items-center bg-[#f1f5f9] rounded-xl p-1 mt-6 gap-1">
              {BILLING_TABS.map((tab) => (
                <button key={tab} onClick={() => setBilling(tab)}
                  className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                    billing === tab
                      ? "bg-white text-[#db4035] shadow-sm"
                      : "text-[#888] hover:text-[#555]"
                  }`}>
                  {tab}
                  {tab === "Yearly" && <span className="ml-1.5 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Save 58%</span>}
                  {tab === "Quarterly" && <span className="ml-1.5 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">Save 20%</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((p, i) => {
              const pricing = PLAN_PRICES[billing][i];
              return (
                <div key={p.name}
                  className={`rounded-2xl p-6 border transition-all ${
                    p.highlight
                      ? "bg-[#db4035] border-[#db4035] shadow-xl shadow-red-200 scale-105"
                      : "bg-white border-red-100"
                  }`}>
                  {p.highlight && (
                    <div className="inline-block bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full mb-3">
                      Most Popular
                    </div>
                  )}
                  <p className={`text-[14px] font-bold mb-1 ${p.highlight ? "text-red-100" : "text-[#888]"}`}>{p.name}</p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className={`text-[34px] font-extrabold leading-none ${p.highlight ? "text-white" : "text-[#1a1a2e]"}`}>
                      {pricing.price}
                    </span>
                    {pricing.period && (
                      <span className={`text-[12px] mb-1 ${p.highlight ? "text-red-100" : "text-[#888]"}`}>{pricing.period}</span>
                    )}
                  </div>
                  {pricing.badge && (
                    <div className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-4 ${
                      p.highlight ? "bg-white/20 text-white" : "bg-green-100 text-green-700"
                    }`}>{pricing.badge}</div>
                  )}
                  {!pricing.badge && <div className="mb-4" />}
                  <ul className="space-y-2.5 mb-6">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className={`h-3.5 w-3.5 shrink-0 ${p.highlight ? "text-white" : "text-[#db4035]"}`} />
                        <span className={`text-[13px] ${p.highlight ? "text-red-50" : "text-[#555]"}`}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => navigate("/login")}
                    className={`w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                      p.highlight
                        ? "bg-white text-[#db4035] hover:bg-red-50"
                        : "bg-[#db4035] text-white hover:bg-[#c0392b]"
                    }`}>
                    {p.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-14 px-5 bg-[#db4035] text-center">
        <h2 className="text-[26px] md:text-[34px] font-extrabold text-white mb-3">
          Ready to grow your sales?
        </h2>
        <p className="text-[14px] text-red-100 mb-7">
          Join thousands of businesses already closing more deals with Internal.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={() => navigate("/login")}
            className="flex items-center gap-2 bg-white text-[#db4035] text-[14px] font-bold px-7 py-3 rounded-xl hover:bg-red-50 transition-all shadow-lg">
            Start for Free <ArrowRight className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-2 text-[14px] font-medium text-white border border-white/30 px-7 py-3 rounded-xl hover:bg-white/10 transition-all">
            <MessageSquare className="h-4 w-4" /> Talk to Sales
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0f172a] text-[#94a3b8] py-10 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-[#db4035] flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[15px] font-bold text-white">Internal</span>
              </div>
              <p className="text-[12px] max-w-xs leading-relaxed">
                India's only All-in-One CRM with Telephony, WhatsApp API & AI Sales Agents. by Internal.
              </p>
              <div className="flex gap-3 mt-4">
                {["f", "in", "tw"].map((s) => (
                  <div key={s} className="h-7 w-7 rounded-lg bg-[#1e293b] flex items-center justify-center text-[11px] font-bold text-[#94a3b8] cursor-pointer hover:text-white transition-colors">
                    {s}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-[12px]">
              <div>
                <p className="text-white font-semibold mb-3">Product</p>
                {["Features", "Pricing", "AI Agents", "Integrations"].map((l) => (
                  <p key={l} className="mb-2 hover:text-white cursor-pointer transition-colors">{l}</p>
                ))}
              </div>
              <div>
                <p className="text-white font-semibold mb-3">Company</p>
                {["About", "Blog", "Careers", "Contact"].map((l) => (
                  <p key={l} className="mb-2 hover:text-white cursor-pointer transition-colors">{l}</p>
                ))}
              </div>
              <div>
                <p className="text-white font-semibold mb-3">Legal</p>
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((l) => (
                  <p key={l} className="mb-2 hover:text-white cursor-pointer transition-colors">{l}</p>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-[#1e293b] pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px]">© {new Date().getFullYear()} Internal. All rights reserved.</p>
            <div className="flex items-center gap-1 text-[11px]">
              <Shield className="h-3.5 w-3.5 text-green-400" />
              <span className="text-green-400">SOC 2 Compliant</span>
              <span className="mx-2">·</span>
              <span>99.9% Uptime SLA</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
