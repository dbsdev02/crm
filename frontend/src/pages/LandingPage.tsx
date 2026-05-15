import { motion } from "framer-motion";
import {
  ArrowRight, Sparkles, KanbanSquare, ListChecks, FolderKanban,
  BarChart3, CalendarDays, Bell, ShieldCheck, Smartphone, Video,
  Bot, Zap, Users, Workflow, Check, Star, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import heroImg from "@/assets/dashboard-hero.jpg";

const features = [
  { icon: KanbanSquare, title: "Lead Management Kanban", desc: "Drag-and-drop pipeline to move leads from cold to closed without a spreadsheet in sight." },
  { icon: ListChecks,   title: "Smart Task Management", desc: "AI prioritizes, assigns and reminds — so the right work happens at the right time." },
  { icon: FolderKanban, title: "Project Tracking",       desc: "Milestones, sprints and dependencies in one calm, focused workspace." },
  { icon: BarChart3,    title: "Team Performance Reports", desc: "Live dashboards reveal who's winning, what's stuck, and where to invest next." },
  { icon: CalendarDays, title: "Calendar & Meetings",    desc: "Unified schedule with Google Meet, reminders and round-robin booking." },
  { icon: Bell,         title: "Smart Notifications",    desc: "Granular alerts across email, push and in-app — right channel, right moment." },
  { icon: Zap,          title: "Credits System",         desc: "Built-in credits for usage-based workflows, billing and AI consumption." },
  { icon: ShieldCheck,  title: "Staff Permissions",      desc: "Role-based access control with audit trails for every sensitive action." },
  { icon: Smartphone,   title: "Mobile CRM Support",     desc: "Native iOS & Android CRM so your team works from anywhere." },
  { icon: Video,        title: "Google Meet Integration", desc: "Spin up meetings from a lead, contact or task in a single click." },
  { icon: Bot,          title: "AI Automation",          desc: "Automate follow-ups, summaries and pipeline hygiene with custom AI agents." },
];

const workflow = [
  { label: "Leads",    icon: Users },
  { label: "Tasks",    icon: ListChecks },
  { label: "Projects", icon: FolderKanban },
  { label: "Meetings", icon: CalendarDays },
  { label: "Reports",  icon: BarChart3 },
  { label: "Growth",   icon: Zap },
];

const reasons = [
  { icon: Zap,         title: "Blazing Fast",            desc: "Sub-100ms interactions across the whole product." },
  { icon: Bot,         title: "AI-powered",              desc: "Built-in agents draft, summarize and follow up." },
  { icon: Smartphone,  title: "Mobile Friendly",         desc: "Pixel-perfect on every device, online or off." },
  { icon: ShieldCheck, title: "Role-based Access",       desc: "SOC2-ready permissions out of the box." },
  { icon: Users,       title: "Real-time Collaboration", desc: "Live cursors, mentions and inline comments." },
  { icon: Bell,        title: "Automated Notifications", desc: "Right channel, right person, right moment." },
];

const plans = [
  {
    name: "Starter", price: "₹999", desc: "For small teams getting their pipeline under control.",
    features: ["Up to 5 users", "Lead Kanban & Tasks", "Calendar & Meetings", "Email support"],
  },
  {
    name: "Professional", price: "₹2,499", desc: "Everything growing teams need to scale revenue.",
    features: ["Unlimited users", "AI automation & reports", "Google Meet integration", "Role-based access", "Priority support"],
    highlighted: true,
  },
  {
    name: "Enterprise", price: "Custom", desc: "Advanced governance and a dedicated success manager.",
    features: ["SSO & SCIM", "Custom AI agents", "Audit logs & SLAs", "Dedicated CSM", "On-prem option"],
  },
];

const testimonials = [
  { name: "Sara Lindqvist", role: "Head of Sales, Northwind",  quote: "We replaced three tools with Internal and our reps actually want to log in. Pipeline visibility went from weekly to real-time." },
  { name: "Marcus Chen",    role: "COO, Fieldscale",           quote: "The AI follow-ups alone closed deals we would have lost. Setup took an afternoon, not a quarter." },
  { name: "Priya Raman",    role: "Founder, Loophaus",         quote: "Beautiful product, ridiculous depth. Tasks, projects, meetings and reporting all finally living together." },
];

const faqs = [
  { q: "How long does setup take?",                    a: "Most teams are live in under an hour. Import contacts via CSV or sync from Google, HubSpot or Pipedrive in one click." },
  { q: "Is my data secure?",                           a: "Yes. Data is encrypted at rest and in transit, and you control region and retention." },
  { q: "Do you offer a free trial?",                   a: "Every plan starts with a 3-day free trial — no credit card, full feature access, cancel anytime." },
  { q: "Can I integrate Google Meet and Calendar?",    a: "Out of the box. Slack, Zoom, Outlook and 40+ tools are also available natively." },
  { q: "What about mobile?",                           a: "Native iOS and Android apps with full feature parity, including offline mode for field teams." },
];

const logos = ["Northwind", "Fieldscale", "Loophaus", "Brightline", "Vector", "Helix"];

function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <nav className="lp-glass rounded-2xl px-5 py-3 flex items-center justify-between lp-shadow-elegant">
          <a href="/login" className="flex items-center gap-2 font-semibold">
            <span className="size-8 rounded-lg lp-gradient-primary grid place-items-center lp-shadow-glow">
              <Sparkles className="size-4 text-white" />
            </span>
            <span className="text-[#1a1a2e]">Internal</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-gray-900 transition-colors">Workflow</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#faq"      className="hover:text-gray-900 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <a href="/login">Login</a>
            </Button>
            <Button asChild size="sm" className="lp-gradient-primary text-white border-0 lp-shadow-glow hover:opacity-90">
              <a href="/login">Start Free</a>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-24">
      <div className="absolute inset-0 lp-gradient-hero pointer-events-none" />
      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="inline-flex items-center gap-2 lp-glass rounded-full px-3 py-1 text-xs text-gray-500">
            <Sparkles className="size-3 text-[#db4035]" /> AI-native CRM · v3.0
          </span>
          <h1 className="mt-5 text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-[#1a1a2e]">
            Manage Leads, Tasks & Teams —{" "}
            <span className="lp-text-gradient">All in One CRM</span>
          </h1>
          <p className="mt-6 text-lg text-gray-500 max-w-xl">
            An AI-powered CRM with task management, projects, meetings, reports, staff
            management, credits and automation — built for teams that grow.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="lp-gradient-primary text-white border-0 lp-shadow-glow hover:opacity-90">
              <a href="/login">Start Free Trial <ArrowRight className="ml-1 size-4" /></a>
            </Button>
            <Button asChild size="lg" variant="outline" className="lp-glass border-gray-200">
              <a href="/login">Book Demo</a>
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="size-4 fill-[#db4035] text-[#db4035]" />)}
              <span className="ml-2">4.9 on G2</span>
            </div>
            <span>3-day free trial · No card</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.1 }} className="relative">
          <div className="absolute -inset-6 lp-gradient-primary rounded-3xl blur-3xl opacity-20" />
          <div className="relative lp-glass rounded-2xl overflow-hidden lp-shadow-glow lp-animate-float">
            <img src={heroImg} alt="Internal dashboard preview" className="w-full h-auto" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustedBy() {
  return (
    <section className="py-12 border-y border-gray-100">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-xs uppercase tracking-widest text-gray-400">Trusted by 12,000+ modern teams</p>
        <div className="mt-6 flex flex-wrap justify-center items-center gap-x-12 gap-y-4 opacity-60">
          {logos.map((l) => <span key={l} className="text-lg font-semibold text-gray-400 tracking-tight">{l}</span>)}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#1a1a2e]">Everything your revenue team needs</h2>
          <p className="mt-4 text-gray-500 text-lg">Ten powerful modules, one elegant workspace. No tab-switching, no duct tape.</p>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.4, delay: i * 0.04 }}
              className="group lp-glass rounded-2xl p-6 hover:border-[#db4035]/40 transition-colors">
              <div className="size-11 rounded-xl lp-gradient-primary grid place-items-center lp-shadow-glow mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="size-5 text-white" />
              </div>
              <h3 className="font-semibold text-lg text-[#1a1a2e]">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section id="workflow" className="py-28 relative">
      <div className="absolute inset-0 lp-gradient-hero opacity-50 pointer-events-none" />
      <div className="mx-auto max-w-7xl px-6 relative">
        <div className="text-center max-w-2xl mx-auto">
          <Workflow className="size-6 text-[#db4035] mx-auto" />
          <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-[#1a1a2e]">One workflow, end to end</h2>
          <p className="mt-4 text-gray-500 text-lg">From first touch to closed-won and beyond — no handoffs, no lost context.</p>
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
          {workflow.map((step, i) => (
            <div key={step.label} className="flex items-center gap-3">
              <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="lp-glass rounded-2xl px-5 py-4 flex items-center gap-3 min-w-[150px]">
                <div className="size-9 rounded-lg lp-gradient-primary grid place-items-center">
                  <step.icon className="size-4 text-white" />
                </div>
                <span className="font-medium text-[#1a1a2e]">{step.label}</span>
              </motion.div>
              {i < workflow.length - 1 && <ArrowRight className="size-4 text-gray-400 hidden md:block" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChoose() {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight max-w-2xl text-[#1a1a2e]">Why teams choose Internal</h2>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reasons.map((r) => (
            <div key={r.title} className="lp-glass rounded-2xl p-6">
              <r.icon className="size-6 text-[#db4035]" />
              <h3 className="mt-4 font-semibold text-lg text-[#1a1a2e]">{r.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#1a1a2e]">Simple, scalable pricing</h2>
          <p className="mt-4 text-gray-500 text-lg">Start free. Upgrade when you grow.</p>
        </div>
        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {plans.map((p) => (
            <div key={p.name} className={`relative lp-glass rounded-2xl p-8 ${p.highlighted ? "border-[#db4035]/60 lp-shadow-glow" : ""}`}>
              {p.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 lp-gradient-primary text-white text-xs font-medium px-3 py-1 rounded-full">
                  Most popular
                </span>
              )}
              <h3 className="font-semibold text-xl text-[#1a1a2e]">{p.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold text-[#1a1a2e]">{p.price}</span>
                {p.price !== "Custom" && <span className="text-gray-400">/mo</span>}
              </div>
              <p className="mt-2 text-sm text-gray-500">{p.desc}</p>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[#1a1a2e]">
                    <Check className="size-4 text-[#db4035]" /> {f}
                  </li>
                ))}
              </ul>
              <Button asChild className={`mt-8 w-full ${p.highlighted ? "lp-gradient-primary text-white border-0 lp-shadow-glow hover:opacity-90" : ""}`}
                variant={p.highlighted ? "default" : "outline"}>
                <a href="/login">{p.price === "Custom" ? "Contact sales" : "Start free trial"}</a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight max-w-2xl text-[#1a1a2e]">Loved by revenue teams worldwide</h2>
        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div key={t.name} className="lp-glass rounded-2xl p-6">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="size-4 fill-[#db4035] text-[#db4035]" />)}
              </div>
              <p className="mt-4 text-[#1a1a2e]/90 leading-relaxed">"{t.quote}"</p>
              <div className="mt-6">
                <div className="font-medium text-[#1a1a2e]">{t.name}</div>
                <div className="text-sm text-gray-500">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section id="faq" className="py-28">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-center text-[#1a1a2e]">Frequently asked</h2>
        <Accordion type="single" collapsible className="mt-10 lp-glass rounded-2xl px-6">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`i${i}`} className="border-gray-100">
              <AccordionTrigger className="text-left text-[#1a1a2e]">{f.q}</AccordionTrigger>
              <AccordionContent className="text-gray-500">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl lp-glass p-12 text-center lp-shadow-glow">
          <div className="absolute inset-0 lp-gradient-hero opacity-80" />
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#1a1a2e]">Ready to scale your business?</h2>
            <p className="mt-4 text-gray-500 text-lg">Join 12,000+ teams running their revenue on Internal.</p>
            <div className="mt-8 flex justify-center gap-3 flex-wrap">
              <Button asChild size="lg" className="lp-gradient-primary text-white border-0 lp-shadow-glow hover:opacity-90">
                <a href="/login">Get Started <ArrowRight className="ml-1 size-4" /></a>
              </Button>
              <Button asChild size="lg" variant="outline" className="lp-glass border-gray-200">
                <a href="/login">Talk to sales</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-100 py-12">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-[#1a1a2e]">
          <span className="size-7 rounded-lg lp-gradient-primary grid place-items-center">
            <Sparkles className="size-3.5 text-white" />
          </span>
          Internal
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-gray-400">
          <a href="#features" className="hover:text-gray-900">Features</a>
          <a href="#pricing"  className="hover:text-gray-900">Pricing</a>
          <a href="#"         className="hover:text-gray-900">Contact</a>
          <a href="/privacy-policy" className="hover:text-gray-900">Privacy Policy</a>
          <a href="/login"    className="hover:text-gray-900">Login</a>
        </div>
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <Globe className="size-3" /> © {new Date().getFullYear()} Internal
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#1a1a2e] font-['Inter',sans-serif]">
      <style>{`
        .lp-gradient-primary { background: linear-gradient(135deg, #db4035, #e8534a); }
        .lp-gradient-hero { background: radial-gradient(ellipse at top, rgba(219,64,53,0.08), transparent 60%), radial-gradient(ellipse at bottom right, rgba(219,64,53,0.05), transparent 55%); }
        .lp-text-gradient { background: linear-gradient(135deg, #db4035, #e8534a); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .lp-glass { background: rgba(255,255,255,0.7); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(0,0,0,0.06); }
        .lp-shadow-glow { box-shadow: 0 20px 60px -20px rgba(219,64,53,0.25); }
        .lp-shadow-elegant { box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08); }
        @keyframes lp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .lp-animate-float { animation: lp-float 6s ease-in-out infinite; }
      `}</style>
      <Nav />
      <main>
        <Hero />
        <TrustedBy />
        <Features />
        <WorkflowSection />
        <WhyChoose />
        <Pricing />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
