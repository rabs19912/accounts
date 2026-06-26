"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addLoanAction } from "@/app/actions/loans";

interface Member {
  id: string;
  name: string;
}

interface Props {
  groupId: string;
  otherMember: Member;
}

export function AddLoanModal({ groupId, otherMember }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await addLoanAction(formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    } else {
      formRef.current?.reset();
      setOpen(false);
      setPending(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" variant="outline">
        + Préstamo
      </Button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-lg">
        <h2 className="mb-1 text-base font-semibold text-foreground">Agregar préstamo</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Le prestás plata a{" "}
          <span className="font-medium text-foreground">{otherMember.name}</span>
        </p>

        <form ref={formRef} action={handleSubmit}>
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="toUserId" value={otherMember.id} />

          <div className="mb-3">
            <label className="mb-1 block text-xs text-foreground/70" htmlFor="loan-name">
              Nombre
            </label>
            <Input
              id="loan-name"
              name="name"
              placeholder="ej: efectivo, almuerzo, nafta…"
              required
            />
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-xs text-foreground/70" htmlFor="loan-amount">
              Monto
            </label>
            <Input
              id="loan-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
            />
          </div>

          <div className="mb-5">
            <label className="mb-1 block text-xs text-foreground/70" htmlFor="loan-date">
              Fecha <span className="text-muted-foreground">(opcional)</span>
            </label>
            <Input id="loan-date" name="date" type="date" />
          </div>

          {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Agregando…" : "Agregar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
