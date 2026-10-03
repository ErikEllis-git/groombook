"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Keeps the dashboard current without a manual reload: re-fetches server data
 * every `intervalMs` while the tab is visible, and right away when Kevin
 * switches back to it.
 */
export function AutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = setInterval(refreshIfVisible, intervalMs);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [router, intervalMs]);

  return null;
}
