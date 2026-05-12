import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const NotificationBell = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const prevUnreadRef = useRef<number | null>(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<any[]>("/notifications"),
    refetchInterval: 30000,
  });

  const { data: unreadData } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: () => api.get<{ count: number }>("/notifications/unread-count"),
    refetchInterval: 8000,
  });

  // Show popup toast when a new notification arrives
  useEffect(() => {
    const current = unreadData?.count ?? 0;
    if (prevUnreadRef.current !== null && current > prevUnreadRef.current) {
      // Refetch to get the latest notification
      qc.invalidateQueries({ queryKey: ["notifications"] });
    }
    prevUnreadRef.current = current;
  }, [unreadData?.count]);

  // Watch notifications list — when it updates and has new unread, show toast
  const prevNotifIdRef = useRef<number | null>(null);
  useEffect(() => {
    const list = notifications as any[];
    if (!list.length) return;
    const latest = list[0];
    if (prevNotifIdRef.current === null) {
      prevNotifIdRef.current = latest.id;
      return;
    }
    if (latest.id !== prevNotifIdRef.current && !latest.is_read) {
      prevNotifIdRef.current = latest.id;
      toast({
        title: latest.title,
        description: latest.message || undefined,
      });
    }
  }, [notifications]);

  const markRead = useMutation({
    mutationFn: (id: number) => api.put(`/notifications/${id}/read`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => api.put("/notifications/read-all", {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const unreadCount = unreadData?.count ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-[#f0f0f0] text-[#777] transition-colors">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#db4035]" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 rounded-xl border border-[#e5e5e5] shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
          <h4 className="text-[14px] font-semibold text-[#202020]">Notifications</h4>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="flex items-center gap-1 text-[12px] text-[#777] hover:text-[#202020] transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="h-72">
          {(notifications as any[]).length === 0 ? (
            <p className="text-[13px] text-[#aaa] text-center py-8">No notifications</p>
          ) : (
            (notifications as any[]).map((n: any) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 border-b border-[#f5f5f5] last:border-0 cursor-pointer hover:bg-[#fafafa] transition-colors",
                  !n.is_read && "bg-[#fef9f9]"
                )}
                onClick={() => !n.is_read && markRead.mutate(n.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[13px] text-[#202020]", !n.is_read && "font-medium")}>{n.title}</p>
                  {n.message && <p className="text-[12px] text-[#777] mt-0.5 truncate">{n.message}</p>}
                  <p className="text-[11px] text-[#aaa] mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && <div className="h-2 w-2 rounded-full bg-[#db4035] mt-1.5 shrink-0" />}
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

import { usePushNotification } from "@/hooks/use-push-notification";

const PushPermissionRequester = () => {
  const { isSupported, isSubscribed, requestAndSubscribe } = usePushNotification();
  useEffect(() => {
    if (isSupported && !isSubscribed) {
      // Delay 3s so it doesn't fire immediately on page load
      const t = setTimeout(() => requestAndSubscribe(), 3000);
      return () => clearTimeout(t);
    }
  }, [isSupported, isSubscribed]);
  return null;
};

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#f7f7f7]">
        {/* Sidebar — desktop only */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <AnnouncementBanner />
          <PushPermissionRequester />

          {/* Top header */}
          <header className="h-12 flex items-center justify-between border-b border-[#e5e5e5] px-4 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <SidebarTrigger className="text-[#777] hover:text-[#202020]" />
              </div>
              <span className="text-[13px] text-[#aaa] hidden md:block">
                {user?.name}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <NotificationBell />
            </div>
          </header>

          <main className="flex-1 overflow-auto pb-20 md:pb-0 p-4 md:p-6">{children}</main>
        </div>
      </div>

      {/* Bottom nav — mobile only */}
      <MobileBottomNav />
    </SidebarProvider>
  );
};
