import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, CheckSquare, FolderOpen, Users, Clock, Award } from "lucide-react";
import { api } from "@/lib/api";

const StatCard = ({ title, value, icon: Icon, description, color }: {
  title: string; value: string | number; icon: React.ElementType; description: string; color: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`rounded-lg p-2 ${color}`}>
        <Icon className="h-4 w-4 text-primary-foreground" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
);

const Index = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";

  const { data: leads = [] } = useQuery({ queryKey: ["leads"], queryFn: () => api.get<any[]>("/leads"), enabled: isAdmin || isStaff });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => api.get<any[]>("/tasks") });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => api.get<any[]>("/projects") });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: () => api.get<any[]>("/auth/users"), enabled: isAdmin });
  const { data: logs = [] } = useQuery({ queryKey: ["logs"], queryFn: () => api.get<any[]>("/logs"), enabled: isAdmin });
  const { data: creditsData } = useQuery({ queryKey: ["my-credits"], queryFn: () => api.get<any>("/credits/my"), enabled: isStaff });

  const activeTasks = (tasks as any[]).filter((t: any) => t.status !== "completed").length;
  const overdueTasks = (tasks as any[]).filter((t: any) => t.status === "overdue").length;
  const activeProjects = (projects as any[]).filter((p: any) => ["active", "in_progress"].includes(p.status));

  const leadStages = ["lead_contacted", "interested", "first_meet_confirmed", "followups", "negotiations", "onboarded"];
  const stageLabels: Record<string, string> = {
    lead_contacted: "Contacted", interested: "Interested", first_meet_confirmed: "1st Meet",
    followups: "Followup", negotiations: "Negotiation", onboarded: "Onboarded",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {isAdmin ? "Overview of your CRM system" : "Your activity overview"}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {(isAdmin || isStaff) && <StatCard title="Total Leads" value={(leads as any[]).length} icon={Target} description="" color="bg-primary" />}
        <StatCard title="Active Tasks" value={activeTasks} icon={CheckSquare} description={`${overdueTasks} overdue`} color="bg-warning" />
        <StatCard title="Projects" value={activeProjects.length} icon={FolderOpen} description="active projects" color="bg-success" />
        {isAdmin && <StatCard title="Team Members" value={(users as any[]).length} icon={Users} description="across all roles" color="bg-info" />}
        {isStaff && <StatCard title="Your Credits" value={creditsData?.balance?.credits ?? 0} icon={Award} description={`${creditsData?.balance?.points ?? 0} points earned`} color="bg-info" />}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest actions across the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(logs as any[]).slice(0, 5).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{log.details}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{log.user_name || `User #${log.user_id}`}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Project Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Progress</CardTitle>
            <CardDescription>Active project completion status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {activeProjects.map((project: any) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{project.name}</span>
                    <span className="text-sm text-muted-foreground">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{project.client_name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lead Pipeline Summary */}
        {(isAdmin || isStaff) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lead Pipeline</CardTitle>
              <CardDescription>Current lead distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leadStages.map((stage) => {
                  const count = (leads as any[]).filter((l: any) => l.stage === stage).length;
                  return (
                    <div key={stage} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{stageLabels[stage]}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overdue Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4 text-destructive" />
              Overdue Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueTasks === 0 ? (
              <p className="text-sm text-muted-foreground">No overdue tasks 🎉</p>
            ) : (
              <div className="space-y-3">
                {(tasks as any[]).filter((t: any) => t.status === "overdue").map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">Due: {task.due_date?.split("T")[0]}</p>
                    </div>
                    <Badge variant="destructive" className="text-xs">Overdue</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
