import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Download, Activity } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

type LogEntry = { id: number; user_id: number; user_name: string; action: string; module: string; details: string; created_at: string };

const Logs = () => {
  const { data: systemLogs = [] } = useQuery({ queryKey: ["logs"], queryFn: () => api.get<LogEntry[]>("/logs") });
  const { data: myLogs = [] } = useQuery({ queryKey: ["my-logs"], queryFn: () => api.get<LogEntry[]>("/logs/my") });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: () => api.get<any[]>("/auth/users") });

  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const filteredSystem = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (systemLogs as LogEntry[]).filter((l) => {
      if (userFilter !== "all" && String(l.user_id) !== userFilter) return false;
      if (!q) return true;
      return (l.details || "").toLowerCase().includes(q) || (l.user_name || "").toLowerCase().includes(q);
    });
  }, [systemLogs, search, userFilter]);

  const userTrail = useMemo(
    () => selectedUserId ? (systemLogs as LogEntry[]).filter((l) => String(l.user_id) === selectedUserId) : [],
    [systemLogs, selectedUserId]
  );

  const exportCSV = (rows: LogEntry[]) => {
    const csv = ["Timestamp,User,Action", ...rows.map((r) => `"${r.created_at}","${r.user_name}","${(r.details || "").replace(/"/g, '""')}"`),].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `crm-logs-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Logs exported", description: `${rows.length} entries downloaded.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Logs</h1>
          <p className="text-muted-foreground">View system events and per-user activity trails</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportCSV(filteredSystem)} disabled={filteredSystem.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Total events</p><p className="text-2xl font-bold">{(systemLogs as LogEntry[]).length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Active users</p><p className="text-2xl font-bold">{new Set((systemLogs as LogEntry[]).map(l => l.user_id)).size}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Today</p><p className="text-2xl font-bold">{(systemLogs as LogEntry[]).filter((l) => l.created_at?.startsWith(new Date().toISOString().slice(0, 10))).length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Last 7 days</p><p className="text-2xl font-bold">{(systemLogs as LogEntry[]).filter((l) => Date.now() - new Date(l.created_at).getTime() < 7 * 86400000).length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="system">
        <TabsList>
          <TabsTrigger value="system">System Logs</TabsTrigger>
          <TabsTrigger value="user">User Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="mt-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search actions or users…" className="pl-9" />
            </div>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {(users as any[]).map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-2">
              {filteredSystem.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Activity className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p>No log entries found.</p>
                </div>
              ) : (
                filteredSystem.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{log.details}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">{log.user_name || `User #${log.user_id}`}</Badge>
                        <Badge variant="secondary" className="text-xs">{log.module}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user" className="mt-4 space-y-3">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="Select a user" /></SelectTrigger>
            <SelectContent>
              {(users as any[]).map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.role})</SelectItem>)}
            </SelectContent>
          </Select>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">
                  Showing <strong>{userTrail.length}</strong> events for <strong>{(users as any[]).find((u: any) => String(u.id) === selectedUserId)?.name || "—"}</strong>
                </p>
                <Button variant="outline" size="sm" onClick={() => exportCSV(userTrail)} disabled={userTrail.length === 0}>
                  <Download className="mr-2 h-3.5 w-3.5" /> Export
                </Button>
              </div>
              {userTrail.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No activity recorded for this user.</p>
              ) : (
                <div className="space-y-2 relative pl-4 border-l border-border">
                  {userTrail.map((log) => (
                    <div key={log.id} className="relative pl-4 pb-3">
                      <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background" />
                      <p className="text-sm">{log.details}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Logs;
