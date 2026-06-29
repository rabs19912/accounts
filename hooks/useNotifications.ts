"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { respondInvitationAction, dismissNotificationAction } from "@/app/actions/invitations";
import { respondGroupDeletionAction } from "@/app/actions/groups";
import { deletePaymentAction } from "@/app/actions/settlements";

export type NotificationType =
  | "INVITATION_RECEIVED"
  | "INVITATION_ACCEPTED"
  | "INVITATION_REJECTED"
  | "GROUP_DELETE_REQUEST"
  | "GROUP_DELETE_ACCEPTED"
  | "GROUP_DELETE_REJECTED"
  | "PAYMENT_REGISTERED";

export interface Notification {
  id: string;
  type: NotificationType;
  groupId: string | null;
  createdAt: string;
  invitation: {
    id: string;
    groupName: string;
    groupId: string | null;
    inviter: { id: string; name: string };
  } | null;
  group: { id: string; name: string } | null;
  settlement: {
    id: string;
    amount: string;
    proofUrl: string | null;
    paidBy: { id: string; name: string };
  } | null;
}

const POLL_INTERVAL = 15_000;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [responding, setResponding] = useState<string | null>(null);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) setNotifications(await res.json());
    } catch {
      // red issue — silencio
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  async function respondInvitation(
    invitationId: string,
    notificationId: string,
    action: "accept" | "reject"
  ) {
    setResponding(notificationId);
    const result = await respondInvitationAction(invitationId, action);
    if (result?.error) {
      setResponding(null);
      return { error: result.error };
    }
    await fetchNotifications();
    router.refresh();
    setResponding(null);
  }

  async function respondGroupDeletion(
    notificationId: string,
    groupId: string,
    action: "accept" | "reject"
  ) {
    setResponding(notificationId);
    const result = await respondGroupDeletionAction(notificationId, groupId, action);
    if (result?.error) {
      setResponding(null);
      return { error: result.error };
    }
    await fetchNotifications();
    router.refresh();
    setResponding(null);
  }

  async function rejectPayment(
    settlementId: string,
    groupId: string,
    notificationId: string
  ) {
    setResponding(notificationId);
    const result = await deletePaymentAction(settlementId, groupId);
    if (result?.error) {
      setResponding(null);
      return { error: result.error };
    }
    await fetchNotifications();
    router.refresh();
    setResponding(null);
  }

  async function dismiss(notificationId: string) {
    await dismissNotificationAction(notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    router.refresh();
  }

  return {
    notifications,
    responding,
    respondInvitation,
    respondGroupDeletion,
    rejectPayment,
    dismiss,
  };
}
