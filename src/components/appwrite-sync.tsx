"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";

export default function AppwriteSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      return;
    }

    if (syncedUserId.current === user.id) {
      return;
    }

    syncedUserId.current = user.id;

    const controller = new AbortController();

    void fetch("/api/appwrite/sync-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: user.id }),
      signal: controller.signal,
    }).then((response) => {
      if (!response.ok) syncedUserId.current = null;
    }).catch(() => {
      if (!controller.signal.aborted) syncedUserId.current = null;
    });

    return () => controller.abort();
  }, [isLoaded, isSignedIn, user]);

  return null;
}
