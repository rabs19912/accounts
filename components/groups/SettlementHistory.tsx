"use client";

import { useState } from "react";
import { Trash2, Receipt } from "lucide-react";
import { deletePaymentAction } from "@/app/actions/settlements";
import { useRouter } from "next/navigation";

export interface PaymentRecord {
  id: string;
  amount: number;
  createdAt: string;
  proofUrl: string | null;
  paidBy: { id: string; name: string };
  receivedBy: { id: string; name: string };
}

interface Props {
  groupId: string;
  payments: PaymentRecord[];
  currentUserId: string;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function SettlementHistory({ groupId, payments, currentUserId }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("¿Borrar este pago? La deuda vuelve a quedar pendiente.")) return;
    setPendingId(id);
    await deletePaymentAction(id, groupId);
    setPendingId(null);
    router.refresh();
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <p className="text-sm text-muted-foreground">Todavía no hay pagos registrados.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {payments.map((p) => {
        const iPaid = p.paidBy.id === currentUserId;
        const iReceived = p.receivedBy.id === currentUserId;
        const canDelete = iPaid || iReceived;
        return (
          <div
            key={p.id}
            className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-medium text-emerald-700">
                {getInitials(p.paidBy.name)}
              </div>
              <div>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{iPaid ? "Vos" : p.paidBy.name}</span>
                  {" → "}
                  <span className="font-medium">{iReceived ? "vos" : p.receivedBy.name}</span>
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                  {p.proofUrl && (
                    <a
                      href={p.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-800"
                    >
                      <Receipt className="h-3.5 w-3.5" /> Ver comprobante
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-emerald-700">
                {formatCurrency(p.amount)}
              </span>
              {canDelete && (
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={pendingId === p.id}
                  className="ml-1 rounded p-1 text-gray-400 transition-colors hover:text-destructive disabled:opacity-50"
                  aria-label="Borrar pago"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
