"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { settleBalanceAction } from "@/app/actions/settlements";
import { useRouter } from "next/navigation";

interface Props {
  groupId: string;
  balance: number;
  creditorName: string;
  creditorAlias: string | null;
  formatCurrency: (n: number) => string;
}

export function PaymentSection({
  groupId,
  balance,
  creditorName,
  creditorAlias,
  formatCurrency,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  if (balance === 0) return null;

  async function handleCopy() {
    if (!creditorAlias) return;
    await navigator.clipboard.writeText(creditorAlias);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSettle() {
    if (!confirm(`¿Confirmás que ya transferiste ${formatCurrency(Math.abs(balance))} a ${creditorName}?`)) return;
    setPending(true);
    await settleBalanceAction(groupId, Math.abs(balance));
    router.refresh();
    setPending(false);
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="mb-3 text-sm font-medium text-amber-800">
        💸 Datos para transferir a {creditorName}
      </p>

      {creditorAlias ? (
        <>
          <p className="mb-1.5 text-xs text-amber-700">Alias de MercadoPago</p>
          <div className="mb-3 flex items-center justify-between rounded-lg border border-amber-200 bg-white px-3 py-2.5">
            <span className="font-mono text-sm font-medium text-gray-900">
              {creditorAlias}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900"
            >
              {copied ? (
                <><Check className="h-3.5 w-3.5" /> Copiado</>
              ) : (
                <><Copy className="h-3.5 w-3.5" /> Copiar</>
              )}
            </button>
          </div>
          <p className="mb-3 text-xs text-amber-700">
            Monto a transferir:{" "}
            <span className="font-semibold">{formatCurrency(Math.abs(balance))}</span>
          </p>
        </>
      ) : (
        <p className="mb-3 text-xs text-amber-700">
          {creditorName} no cargó su alias de MercadoPago todavía.
        </p>
      )}

      <Button
        size="sm"
        className="w-full"
        onClick={handleSettle}
        disabled={pending}
      >
        {pending ? "Guardando…" : "✓ Marcar como saldado"}
      </Button>
    </div>
  );
}
