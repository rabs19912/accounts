"use client";

import { useRef, useState, useEffect } from "react";
import { Bell, CheckCircle, XCircle } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import Link from "next/link";

export function NotificationBell() {
  const { notifications, responding, respondInvitation, respondGroupDeletion, dismiss } =
    useNotifications();
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
        <Bell className="h-[18px] w-[18px]" />
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
              <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Sin notificaciones</p>
            </div>
          ) : (
            <ul className="max-h-96 divide-y divide-border overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className="px-4 py-3">
                  {n.type === "INVITATION_RECEIVED" && n.invitation && (
                    <InvitationReceived
                      notification={n}
                      onRespond={respondInvitation}
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
                  {n.type === "GROUP_DELETE_REQUEST" && n.group && (
                    <GroupDeleteRequest
                      notification={n}
                      onRespond={respondGroupDeletion}
                      responding={responding}
                    />
                  )}
                  {n.type === "GROUP_DELETE_ACCEPTED" && n.group && (
                    <GroupDeleteResult
                      notification={n}
                      accepted
                      onDismiss={dismiss}
                    />
                  )}
                  {n.type === "GROUP_DELETE_REJECTED" && n.group && (
                    <GroupDeleteResult
                      notification={n}
                      accepted={false}
                      onDismiss={dismiss}
                    />
                  )}
                  {n.type === "PAYMENT_REGISTERED" && n.settlement && (
                    <PaymentRegistered
                      notification={n}
                      onDismiss={dismiss}
                      onNavigate={() => setOpen(false)}
                    />
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

type N = ReturnType<typeof useNotifications>["notifications"][number];

function InvitationReceived({
  notification: n,
  onRespond,
  responding,
}: {
  notification: N;
  onRespond: ReturnType<typeof useNotifications>["respondInvitation"];
  responding: string | null;
}) {
  const isPending = responding === n.id;
  return (
    <div>
      <div className="mb-0.5 flex items-start gap-2">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
        <p className="text-sm text-foreground">
          <span className="font-medium">{n.invitation!.inviter.name}</span> te invitó a
          compartir gastos en{" "}
          <span className="font-medium">{n.invitation!.groupName}</span>
        </p>
      </div>
      <p className="mb-2 pl-4 text-xs text-muted-foreground">{formatRelative(n.createdAt)}</p>
      <div className="flex gap-2 pl-4">
        <button
          onClick={() => onRespond(n.invitation!.id, n.id, "accept")}
          disabled={isPending}
          className="flex items-center gap-1 rounded-lg bg-foreground px-3 py-1 text-xs font-medium text-background disabled:opacity-50"
        >
          <CheckCircle className="h-3 w-3" /> {isPending ? "…" : "Aceptar"}
        </button>
        <button
          onClick={() => onRespond(n.invitation!.id, n.id, "reject")}
          disabled={isPending}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <XCircle className="h-3 w-3" /> Rechazar
        </button>
      </div>
    </div>
  );
}

function InvitationAccepted({
  notification: n,
  onDismiss,
  onNavigate,
}: {
  notification: N;
  onDismiss: (id: string) => void;
  onNavigate: () => void;
}) {
  return (
    <div>
      <div className="mb-0.5 flex items-start gap-2">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
        <p className="text-sm text-foreground">
          Tu invitación a{" "}
          <span className="font-medium">{n.invitation!.groupName}</span> fue{" "}
          <span className="font-medium text-emerald-600">aceptada</span>
        </p>
      </div>
      <p className="mb-2 pl-4 text-xs text-muted-foreground">{formatRelative(n.createdAt)}</p>
      <div className="flex gap-3 pl-4">
        {n.invitation!.groupId && (
          <Link
            href={`/grupos/${n.invitation!.groupId}`}
            onClick={onNavigate}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Ver el grupo →
          </Link>
        )}
        <button onClick={() => onDismiss(n.id)} className="text-xs text-muted-foreground hover:text-foreground">
          Cerrar
        </button>
      </div>
    </div>
  );
}

function InvitationRejected({ notification: n, onDismiss }: { notification: N; onDismiss: (id: string) => void }) {
  return (
    <div>
      <div className="mb-0.5 flex items-start gap-2">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />
        <p className="text-sm text-foreground">
          Tu invitación a <span className="font-medium">{n.invitation!.groupName}</span> fue{" "}
          <span className="font-medium text-red-500">rechazada</span>
        </p>
      </div>
      <p className="mb-2 pl-4 text-xs text-muted-foreground">{formatRelative(n.createdAt)}</p>
      <div className="pl-4">
        <button onClick={() => onDismiss(n.id)} className="text-xs text-muted-foreground hover:text-foreground">
          Cerrar
        </button>
      </div>
    </div>
  );
}

function GroupDeleteRequest({
  notification: n,
  onRespond,
  responding,
}: {
  notification: N;
  onRespond: ReturnType<typeof useNotifications>["respondGroupDeletion"];
  responding: string | null;
}) {
  const isPending = responding === n.id;
  return (
    <div>
      <div className="mb-0.5 flex items-start gap-2">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
        <p className="text-sm text-foreground">
          El otro miembro quiere eliminar el grupo{" "}
          <span className="font-medium">{n.group!.name}</span>. ¿Confirmás?
        </p>
      </div>
      <p className="mb-2 pl-4 text-xs text-muted-foreground">{formatRelative(n.createdAt)}</p>
      <div className="flex gap-2 pl-4">
        <button
          onClick={() => onRespond(n.id, n.group!.id, "accept")}
          disabled={isPending}
          className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          <Trash2Icon /> {isPending ? "…" : "Confirmar eliminación"}
        </button>
        <button
          onClick={() => onRespond(n.id, n.group!.id, "reject")}
          disabled={isPending}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          Rechazar
        </button>
      </div>
    </div>
  );
}

function GroupDeleteResult({
  notification: n,
  accepted,
  onDismiss,
}: {
  notification: N;
  accepted: boolean;
  onDismiss: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-0.5 flex items-start gap-2">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${accepted ? "bg-red-500" : "bg-gray-400"}`} />
        <p className="text-sm text-foreground">
          La eliminación del grupo <span className="font-medium">{n.group!.name}</span> fue{" "}
          <span className={`font-medium ${accepted ? "text-red-500" : "text-gray-600"}`}>
            {accepted ? "confirmada" : "rechazada"}
          </span>
        </p>
      </div>
      <p className="mb-2 pl-4 text-xs text-muted-foreground">{formatRelative(n.createdAt)}</p>
      <div className="pl-4">
        <button onClick={() => onDismiss(n.id)} className="text-xs text-muted-foreground hover:text-foreground">
          Cerrar
        </button>
      </div>
    </div>
  );
}

function PaymentRegistered({
  notification: n,
  onDismiss,
  onNavigate,
}: {
  notification: N;
  onDismiss: (id: string) => void;
  onNavigate: () => void;
}) {
  const amount = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(Number(n.settlement!.amount));
  return (
    <div>
      <div className="mb-0.5 flex items-start gap-2">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
        <p className="text-sm text-foreground">
          <span className="font-medium">{n.settlement!.paidBy.name}</span> registró un pago de{" "}
          <span className="font-medium">{amount}</span>
          {n.group && (
            <>
              {" "}en <span className="font-medium">{n.group.name}</span>
            </>
          )}
        </p>
      </div>
      <p className="mb-2 pl-4 text-xs text-muted-foreground">{formatRelative(n.createdAt)}</p>
      <div className="flex gap-3 pl-4">
        {n.groupId && (
          <Link
            href={`/grupos/${n.groupId}`}
            onClick={onNavigate}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Ver grupo →
          </Link>
        )}
        <button onClick={() => onDismiss(n.id)} className="text-xs text-muted-foreground hover:text-foreground">
          Cerrar
        </button>
      </div>
    </div>
  );
}

function Trash2Icon() {
  return <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
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
