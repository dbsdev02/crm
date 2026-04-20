export type LeadStage =
  | "contacted"
  | "interested"
  | "meeting"
  | "followup"
  | "negotiation"
  | "uninterested"
  | "onboarded";

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  stage: LeadStage;
  assignedTo: string;
  comments: { text: string; author: string; date: string; stage: LeadStage }[];
  createdAt: string;
  value: number;
  custom?: Record<string, string>;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string[];
  projectId?: string;
  customerId?: string;
  deadline: string;
  completedAt?: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  priority: "low" | "medium" | "high";
  createdBy: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  status: "active" | "inactive" | "prospect";
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  description: string;
  progress: number;
  status: "active" | "completed" | "on_hold";
  tasks: string[];
  createdAt: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
  permissions: string[];
  credits: number;
  points: number;
  avatar?: string;
  joinedAt: string;
}

export interface Announcement {
  id: string;
  message: string;
  active: boolean;
  createdAt: string;
}

export const LEAD_STAGES: { key: LeadStage; label: string; color: string }[] = [
  { key: "contacted", label: "Lead Contacted", color: "bg-lead-contacted" },
  { key: "interested", label: "Interested", color: "bg-lead-interested" },
  { key: "meeting", label: "1st Meet Confirmed", color: "bg-lead-meeting" },
  { key: "followup", label: "Followups", color: "bg-lead-followup" },
  { key: "negotiation", label: "Negotiations", color: "bg-lead-negotiation" },
  { key: "uninterested", label: "Uninterested", color: "bg-lead-uninterested" },
  { key: "onboarded", label: "Onboarded", color: "bg-lead-onboarded" },
];

export const mockLeads: Lead[] = [
  {
    id: "l1", name: "Sarah Johnson", company: "TechCorp Inc.", email: "sarah@techcorp.com",
    phone: "+1-555-0101", stage: "contacted", assignedTo: "2", value: 25000,
    comments: [{ text: "Initial contact made via LinkedIn", author: "John Staff", date: "2026-04-10", stage: "contacted" }],
    createdAt: "2026-04-10",
  },
  {
    id: "l2", name: "Mike Chen", company: "Digital Solutions", email: "mike@digsol.com",
    phone: "+1-555-0102", stage: "interested", assignedTo: "2", value: 45000,
    comments: [{ text: "Showed interest in premium package", author: "John Staff", date: "2026-04-08", stage: "interested" }],
    createdAt: "2026-04-05",
  },
  {
    id: "l3", name: "Emily Davis", company: "GrowthMedia", email: "emily@growthmedia.com",
    phone: "+1-555-0103", stage: "meeting", assignedTo: "2", value: 60000,
    comments: [{ text: "Meeting scheduled for April 15", author: "John Staff", date: "2026-04-12", stage: "meeting" }],
    createdAt: "2026-04-01",
  },
  {
    id: "l4", name: "Alex Rivera", company: "StartupHub", email: "alex@startuphub.com",
    phone: "+1-555-0104", stage: "followup", assignedTo: "2", value: 30000,
    comments: [{ text: "Following up on proposal sent last week", author: "John Staff", date: "2026-04-11", stage: "followup" }],
    createdAt: "2026-03-28",
  },
  {
    id: "l5", name: "Lisa Wang", company: "CloudNine", email: "lisa@cloudnine.com",
    phone: "+1-555-0105", stage: "negotiation", assignedTo: "2", value: 80000,
    comments: [{ text: "Negotiating contract terms", author: "John Staff", date: "2026-04-13", stage: "negotiation" }],
    createdAt: "2026-03-20",
  },
  {
    id: "l6", name: "Tom Brown", company: "WebWorks", email: "tom@webworks.com",
    phone: "+1-555-0106", stage: "onboarded", assignedTo: "2", value: 35000,
    comments: [{ text: "Contract signed, onboarding started", author: "John Staff", date: "2026-04-09", stage: "onboarded" }],
    createdAt: "2026-03-15",
  },
];

export const mockTasks: Task[] = [
  { id: "t1", title: "Complete website redesign proposal", description: "Create a detailed proposal for TechCorp website redesign", assignedTo: ["2"], projectId: "p1", deadline: "2026-04-16", status: "in_progress", priority: "high", createdBy: "1" },
  { id: "t2", title: "Social media content calendar", description: "Prepare next week's social media content", assignedTo: ["2"], projectId: "p1", deadline: "2026-04-15", status: "pending", priority: "medium", createdBy: "1" },
  { id: "t3", title: "SEO audit report", description: "Complete SEO audit for GrowthMedia", assignedTo: ["2"], deadline: "2026-04-18", status: "pending", priority: "high", createdBy: "1" },
  { id: "t4", title: "Client presentation", description: "Prepare quarterly review presentation", assignedTo: ["2"], projectId: "p2", deadline: "2026-04-14", status: "overdue", priority: "high", createdBy: "1" },
  { id: "t5", title: "Update CRM records", description: "Clean up and update all lead records", assignedTo: ["2"], deadline: "2026-04-20", status: "pending", priority: "low", createdBy: "1" },
];

export const mockProjects: Project[] = [
  { id: "p1", name: "TechCorp Website Redesign", clientName: "Sarah Johnson", clientEmail: "sarah@techcorp.com", clientPhone: "+1-555-0101", description: "Complete website redesign with modern UI", progress: 65, status: "active", tasks: ["t1", "t2"], createdAt: "2026-03-01" },
  { id: "p2", name: "GrowthMedia SEO Campaign", clientName: "Emily Davis", clientEmail: "emily@growthmedia.com", clientPhone: "+1-555-0103", description: "6-month SEO optimization campaign", progress: 40, status: "active", tasks: ["t3", "t4"], createdAt: "2026-02-15" },
  { id: "p3", name: "CloudNine Brand Identity", clientName: "Lisa Wang", clientEmail: "lisa@cloudnine.com", clientPhone: "+1-555-0105", description: "Full brand identity redesign", progress: 90, status: "active", tasks: [], createdAt: "2026-01-10" },
];

export const mockStaff: StaffMember[] = [
  { id: "1", name: "Admin User", email: "admin@crm.com", role: "admin", permissions: ["all"], credits: 0, points: 0, joinedAt: "2025-01-01" },
  { id: "2", name: "John Staff", email: "staff@crm.com", role: "staff", permissions: ["leads", "tasks", "projects", "calendar", "assets"], credits: 15, points: 42, joinedAt: "2025-06-15" },
  { id: "4", name: "Emma Wilson", email: "emma@crm.com", role: "staff", permissions: ["leads", "tasks", "projects"], credits: 22, points: 58, joinedAt: "2025-08-01" },
  { id: "5", name: "David Park", email: "david@crm.com", role: "staff", permissions: ["tasks", "projects", "seo"], credits: 8, points: 31, joinedAt: "2025-09-10" },
];

export const mockCustomers: Customer[] = [
  { id: "c1", name: "Sarah Johnson", company: "TechCorp Inc.", email: "sarah@techcorp.com", phone: "+1-555-0101", address: "100 Market St, San Francisco, CA", notes: "Prefers email contact, key decision maker.", status: "active", createdAt: "2026-03-10" },
  { id: "c2", name: "Lisa Wang", company: "CloudNine", email: "lisa@cloudnine.com", phone: "+1-555-0105", address: "500 Cloud Ave, Seattle, WA", notes: "Recently onboarded.", status: "active", createdAt: "2026-03-22" },
  { id: "c3", name: "Tom Brown", company: "WebWorks", email: "tom@webworks.com", phone: "+1-555-0106", address: "22 Web Lane, Austin, TX", notes: "Long-term retainer client.", status: "active", createdAt: "2026-02-15" },
  { id: "c4", name: "Priya Patel", company: "Bright Ideas Co.", email: "priya@brightideas.com", phone: "+1-555-0110", notes: "Evaluating proposal.", status: "prospect", createdAt: "2026-04-01" },
];

export const mockAnnouncements: Announcement[] = [
  { id: "a1", message: "🔔 Internal Google Meet at 12:00 PM on 15 April — All hands meeting", active: true, createdAt: "2026-04-14" },
  { id: "a2", message: "🎉 Welcome Emma Wilson to the team!", active: true, createdAt: "2026-04-13" },
];

export const mockActivityLog = [
  { id: "ac1", user: "John Staff", action: "Moved lead 'Sarah Johnson' to Contacted", timestamp: "2026-04-14T10:30:00" },
  { id: "ac2", user: "Admin User", action: "Created new task 'Complete website redesign proposal'", timestamp: "2026-04-14T09:15:00" },
  { id: "ac3", user: "Emma Wilson", action: "Completed task 'Client onboarding checklist'", timestamp: "2026-04-13T16:45:00" },
  { id: "ac4", user: "David Park", action: "Added new project 'CloudNine Brand Identity'", timestamp: "2026-04-13T14:20:00" },
  { id: "ac5", user: "John Staff", action: "Updated lead 'Mike Chen' stage to Interested", timestamp: "2026-04-13T11:00:00" },
];
