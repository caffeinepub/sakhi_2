import { useCallback, useEffect, useState } from "react";

export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      Notification.requestPermission().then((p) => setPermission(p));
    }
  }, []);

  const notify = useCallback((title: string, body: string) => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/assets/generated/sakhi-logo-transparent.dim_120x120.png",
      });
    }
  }, []);

  return { permission, notify };
}
