import { useState, useEffect } from "react";
import { api } from "@/lib/api";

function waitForOneSignal(): Promise<any> {
  return new Promise((resolve) => {
    const check = () => {
      const w = window as any;
      if (w._oneSignalReady && w.OneSignal) resolve(w.OneSignal);
      else setTimeout(check, 200);
    };
    check();
  });
}

export function usePushNotification() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSupported] = useState(() => "Notification" in window && "serviceWorker" in navigator);

  useEffect(() => {
    if (!isSupported) return;
    waitForOneSignal().then((os) => {
      setIsSubscribed(!!os.User?.PushSubscription?.optedIn);
      os.User.PushSubscription.addEventListener("change", (event: any) => {
        const optedIn = !!event.current?.optedIn;
        setIsSubscribed(optedIn);
        if (optedIn && event.current?.id) {
          api.post("/push/subscribe", { playerId: event.current.id });
        }
        setLoading(false);
      });
    });
  }, [isSupported]);

  const requestAndSubscribe = async () => {
    setLoading(true);
    const os = await waitForOneSignal();
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await os.User.PushSubscription.optIn();
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    const os = await waitForOneSignal();
    try {
      await os.User.PushSubscription.optOut();
    } catch {
      setLoading(false);
    }
  };

  return { isSupported, isSubscribed, loading, requestAndSubscribe, unsubscribe };
}
