"use client";

import { useRef, useState, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import Link from "next/link";

export function NotificationBell() {
  const { notifications, responding, respond, dismiss } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Notificaciones"
      >
        <BellIcon />
        {notifications.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {notifications.length > 9 ? "9+" : notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-medium text-foreground">Notificaciones</span>
            {notifications.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {notifications.length} nueva{notifications.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">Sin notificaciones</p>
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-border">
              {notifications.map((n) => (
                <li key={n.id} className="px-4 py-3">
                  {n.type === "INVITATION_RECEIVED" && n.invitation && (
                    <InvitationReceived
                      notification={n}
                      onRespond={respond}
                      responding={responding}
                    />
                  )}
                  {n.type === "INVITATION_ACCEPTED" && n.invitation && (
                    <InvitationAccepted
                      notification={n}
                      onDismiss={dismiss}
                      onNavigate={() => setOpen(false)}
                    />
                  )}
                  {n.type === "INVITATION_REJECTED" && n.invitation && (
                    <InvitationRejected notification={n} onDismiss={dismiss} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function InvitationReceived({
  notification,
  onRespond,
  responding,
}: {
  notification: ReturnType<typeof useNotifications>["notifications"][number];
  onRespond: ReturnType<typeof useNotifications>["respond"];
  responding: string | null;
}) {
  const isPending = responding === notification.id;

  return (
    <div>
      <div className="mb-0.5 flex items-start gap-2">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
        <p className="text-sm text-foreground">
          <span className="font-medium">{notification.invitation!.inviter.name}</span> te invitó
          a compartir gastos en{" "}
          <span className="font-medium">{notification.invitation!.groupName}</span>
        </p>
      </div>
      <p className="mb-2 pl-4 text-xs text-muted-foreground">
        {formatRelative(notification.createdAt)}
      </p>
      <div className="flex gap-2 pl-4">
        <button
          onClick={() => onRespond(notification.invitation!.id, notification.id, "accept")}
          disabled={isPending}
          className="rounded-lg bg-foreground px-3 py-1 text-xs font-medium text-background transition-opacity disabled:opacity-50"
        >
          {isPending ? "…" : "Aceptar"}
        </button>
        <button
          onClick={() => onRespond(notification.invitation!.id, notification.id, "reject")}
          disabled={isPending}
          className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          Rechazar
        </button>
      </div>
    </div>
  );
}

function InvitationAccepted({
  notification,
  onDismiss,
  onNavigate,
}: {
  notification: ReturnType<typeof useNotifications>["notifications"][number];
  onDismiss: (id: string) => void;
  onNavigate: () => void;
}) {
  return (
    <div>
      <div className="mb-0.5 flex items-start gap-2">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
        <p className="text-sm text-foreground">
          Tu invitación a{" "}
          <span className="font-medium">{notification.invitation!.groupName}</span> fue{" "}
          <span className="font-medium text-emerald-600">aceptada</span>
        </p>
      </div>
      <p className="mb-2 pl-4 text-xs text-muted-foreground">
        {formatRelative(notification.createdAt)}
      </p>
      <div className="flex gap-2 pl-4">
        {notification.invitation!.groupId && (
          <Link
            href={`/grupos/${notification.invitation!.groupId}`}
            onClick={onNavigate}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Ver el grupo →
          </Link>
        )}
        <button
          onClick={() => onDismiss(notification.id)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

function InvitationRejected({
  notification,
  onDismiss,
}: {
  notification: ReturnType<typeof useNotifications>["notifications"][number];
  onDismiss: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-0.5 flex items-start gap-2">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />
        <p className="text-sm text-foreground">
          Tu invitación a{" "}
          <span className="font-medium">{notification.invitation!.groupName}</span> fue{" "}
          <span className="font-medium text-red-500">rechazada</span>
        </p>
      </div>
      <p className="mb-2 pl-4 text-xs text-muted-foreground">
        {formatRelative(notification.createdAt)}
      </p>
      <div className="pl-4">
        <button
          onClick={() => onDismiss(notification.id)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}
