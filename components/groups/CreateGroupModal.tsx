"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { createGroupAction } from "@/app/actions/groups";

type User = { id: string; name: string; email: string };

export function CreateGroupModal({ users }: { users: User[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await createGroupAction(formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        + Crear grupo
      </Button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-lg">
        <h2 className="mb-1 text-base font-semibold text-foreground">Crear grupo</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Elegí con quién compartir gastos
        </p>

        <form ref={formRef} action={handleSubmit}>
          <label className="mb-1 block text-xs text-foreground/70" htmlFor="userId">
            Invitar a
          </label>
          <select
            id="userId"
            name="userId"
            required
            className="mb-4 h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Seleccioná un usuario</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — {u.email}
              </option>
            ))}
          </select>

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
              {pending ? "Creando…" : "Crear"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
