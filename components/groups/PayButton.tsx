"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { registerPaymentAction } from "@/app/actions/settlements";
import { useRouter } from "next/navigation";

interface Props {
  groupId: string;
  toUserId: string;
  toName: string;
  toAlias: string | null;
  amount: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function PayButton({ groupId, toUserId, toName, toAlias, amount }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCopy() {
    if (!toAlias) return;
    await navigator.clipboard.writeText(toAlias);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePaid() {
    setPending(true);
    setError(null);
    const result = await registerPaymentAction(groupId, toUserId, amount);
    if (result?.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    setOpen(false);
    setPending(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-gray-900 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-gray-700"
      >
        Pagar
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-lg">
            <h2 className="mb-1 text-base font-semibold text-foreground">
              Pagar a {toName}
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Transferí <span className="font-medium text-foreground">{formatCurrency(amount)}</span> y
              después marcá el pago.
            </p>

            {toAlias ? (
              <>
                <p className="mb-1 text-xs text-foreground/70">Alias de MercadoPago</p>
                <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <span className="font-mono text-sm font-medium text-gray-900">{toAlias}</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800"
                  >
                    {copied ? (
                      <><Check className="h-3.5 w-3.5" /> Copiado</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5" /> Copiar</>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                {toName} todavía no cargó su alias de MercadoPago. Coordiná el pago por fuera.
              </p>
            )}

            {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handlePaid} disabled={pending}>
                {pending ? "Registrando…" : "✓ Ya pagué"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
