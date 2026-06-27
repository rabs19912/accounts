"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addExpenseAction } from "@/app/actions/groups";
import { addLoanAction } from "@/app/actions/loans";
import { useRouter } from "next/navigation";

type ItemType = "expense" | "loan";

interface Member {
  id: string;
  name: string;
}

interface Props {
  groupId: string;
  members: Member[]; // otros miembros (sin el usuario actual)
}

export function AddItemFAB({ groupId, members }: Props) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ItemType>("expense");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function close() {
    setOpen(false);
    setTimeout(() => {
      setType("expense");
      setError(null);
    }, 250);
  }

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const action = type === "expense" ? addExpenseAction : addLoanAction;
    const result = await action(formData);

    if (result?.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    formRef.current?.reset();
    router.refresh();
    close();
    setPending(false);
  }

  const config = {
    expense: {
      title: "Agregar gasto",
      hint: "Se divide entre todos los miembros",
      namePlaceholder: "ej: cena, taxi, super…",
      amountLabel: "Precio",
      submitLabel: "Agregar gasto",
    },
    loan: {
      title: "Agregar préstamo",
      hint: "Le prestás plata a una persona del grupo",
      namePlaceholder: "ej: efectivo, almuerzo…",
      amountLabel: "Monto",
      submitLabel: "Agregar préstamo",
    },
  }[type];

  const canLoan = members.length > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-sky-700 active:scale-95"
        aria-label="Agregar gasto o préstamo"
      >
        <Plus className="h-6 w-6" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="w-full max-w-sm rounded-t-2xl border border-border bg-background p-6 shadow-xl sm:rounded-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">{config.title}</h2>
                <p className="text-xs text-muted-foreground">{config.hint}</p>
              </div>
              <button
                onClick={close}
                className="ml-4 rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2">
              <TypeCard
                selected={type === "expense"}
                onClick={() => setType("expense")}
                emoji="💸"
                label="Gasto"
                desc="Se divide entre todos"
              />
              <TypeCard
                selected={type === "loan"}
                onClick={() => canLoan && setType("loan")}
                emoji="🤝"
                label="Préstamo"
                desc="A una persona puntual"
                disabled={!canLoan}
              />
            </div>

            <form ref={formRef} action={handleSubmit}>
              <input type="hidden" name="groupId" value={groupId} />

              <div className="mb-3">
                <label className="mb-1 block text-xs text-foreground/70" htmlFor="fab-name">
                  Nombre
                </label>
                <Input
                  id="fab-name"
                  name="name"
                  placeholder={config.namePlaceholder}
                  required
                  autoFocus
                />
              </div>

              {type === "loan" && (
                <div className="mb-3">
                  <label className="mb-1 block text-xs text-foreground/70" htmlFor="fab-to">
                    ¿A quién le prestás?
                  </label>
                  <select
                    id="fab-to"
                    name="toUserId"
                    required
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">Elegí una persona…</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mb-3">
                <label className="mb-1 block text-xs text-foreground/70" htmlFor="fab-amount">
                  {config.amountLabel}
                </label>
                <Input
                  id="fab-amount"
                  name={type === "expense" ? "price" : "amount"}
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="mb-5">
                <label className="mb-1 block text-xs text-foreground/70" htmlFor="fab-date">
                  Fecha <span className="text-muted-foreground">(opcional)</span>
                </label>
                <Input id="fab-date" name="date" type="date" />
              </div>

              {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={close} disabled={pending}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? "Agregando…" : config.submitLabel}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function TypeCard({
  selected,
  onClick,
  emoji,
  label,
  desc,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
  desc: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center rounded-xl p-3 text-center transition-all disabled:opacity-40 ${
        selected
          ? "border-2 border-sky-500 bg-sky-50"
          : "border border-border bg-muted/30 hover:border-border-strong"
      }`}
    >
      <span className="mb-1 text-xl">{emoji}</span>
      <span className={`text-sm font-medium ${selected ? "text-sky-700" : "text-foreground"}`}>
        {label}
      </span>
      <span className="mt-0.5 text-[10px] text-muted-foreground">{desc}</span>
    </button>
  );
}
