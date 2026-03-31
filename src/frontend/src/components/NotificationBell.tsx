import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { NotifType, type Notification } from "../backend.d";
import { useActor } from "../hooks/useActor";

function notifLabel(t: NotifType) {
  if (t === NotifType.sos_update) return "SOS Update";
  if (t === NotifType.fir_update) return "FIR Update";
  return "New Alert";
}

export default function NotificationBell() {
  const { actor } = useActor();
  const [count, setCount] = useState(0);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchCount = useCallback(async () => {
    if (!actor) return;
    try {
      const c = await actor.getUnreadNotificationCount();
      setCount(Number(c));
    } catch {}
  }, [actor]);

  const fetchNotifs = useCallback(async () => {
    if (!actor) return;
    try {
      const ns = await actor.getMyNotifications();
      setNotifs(ns);
    } catch {}
  }, [actor]);

  const markRead = useCallback(
    async (id: bigint) => {
      if (!actor) return;
      try {
        await actor.markNotificationRead(id);
        setNotifs((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        );
        setCount((c) => Math.max(0, c - 1));
      } catch {}
    },
    [actor],
  );

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  const handleOpen = (o: boolean) => {
    setOpen(o);
    if (o) fetchNotifs();
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bell className="w-4 h-4" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card border-border" align="end">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">
            Notifications
          </h3>
        </div>
        <ScrollArea className="h-72">
          {notifs.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              No notifications
            </p>
          ) : (
            <div className="flex flex-col">
              {notifs.map((n) => (
                <div
                  key={String(n.id)}
                  className={`flex flex-col gap-1 px-4 py-3 border-b border-border/50 ${
                    n.isRead ? "opacity-60" : "bg-primary/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <Badge variant="outline" className="text-[10px] mb-1">
                        {notifLabel(n.notifType)}
                      </Badge>
                      <p className="text-xs text-foreground">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(
                          Number(n.timestamp) / 1_000_000,
                        ).toLocaleString()}
                      </p>
                    </div>
                    {!n.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] px-2 shrink-0"
                        onClick={() => markRead(n.id)}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
