"use client";

import { useEffect, useState, useCallback } from "react";
import { respondInvitationAction, dismissNotificationAction } from "@/app/actions/invitations";

export type NotificationType =
  | "INVITATION_RECEIVED"
  | "INVITATION_ACCEPTED"
  | "INVITATION_REJECTED";

export interface Notification {
  id: string;
  type: NotificationType;
  createdAt: string;
  invitation: {
    id: string;
    groupName: string;
    groupId: string | null;
    inviter: { id: string; name: string };
  } | null;
}

const POLL_INTERVAL = 15_000;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [responding, setResponding] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) setNotifications(await res.json());
    } catch {
      // red issue — silencio, no interrumpir al usuario
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  async function respond(invitationId: string, notificationId: string, action: "accept" | "reject") {
    setResponding(notificationId);
    const result = await respondInvitationAction(invitationId, action);
    if (result?.error) {
      setResponding(null);
      return { error: result.error };
    }
    await fetchNotifications();
    setResponding(null);
  }

  async function dismiss(notificationId: string) {
    await dismissNotificationAction(notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }

  return { notifications, responding, respond, dismiss };
}
