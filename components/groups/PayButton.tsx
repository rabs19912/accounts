"use client";

import { useRef, useState } from "react";
import { Copy, Check, Paperclip, X } from "lucide-react";
import { upload } from "@vercel/blob/client";
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
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

    try {
      let proofUrl: string | undefined;

      if (file) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const blob = await upload(`comprobantes/${crypto.randomUUID()}.${ext}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        proofUrl = blob.url;
      }

      const result = await registerPaymentAction(groupId, toUserId, amount, proofUrl);
      if (result?.error) {
        setError(result.error);
        setPending(false);
        return;
      }

      setOpen(false);
      setFile(null);
      setPending(false);
      router.refresh();
    } catch {
      setError("No se pudo subir el comprobante. Intentá de nuevo.");
      setPending(false);
    }
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

            <p className="mb-1 text-xs text-foreground/70">
              Comprobante <span className="text-muted-foreground">(opcional)</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <span className="truncate text-xs text-gray-700">{file.name}</span>
                <button
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="ml-2 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Quitar comprobante"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong px-3 py-3 text-xs text-muted-foreground hover:bg-muted/30"
              >
                <Paperclip className="h-4 w-4" /> Adjuntar foto
              </button>
            )}

            {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handlePaid} disabled={pending}>
                {pending ? "Subiendo…" : "✓ Ya pagué"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
