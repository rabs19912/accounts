"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createGroupWithInvitesAction } from "@/app/actions/invitations";

type User = { id: string; name: string; email: string };
type Status = "idle" | "pending" | "error";

export function CreateGroupModal({
  users,
  currentUserName,
}: {
  users: User[];
  currentUserName: string;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function close() {
    setOpen(false);
    setTimeout(() => {
      setStatus("idle");
      setError(null);
      setSelectedIds([]);
    }, 300);
  }

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(formData: FormData) {
    setStatus("pending");
    setError(null);
    const result = await createGroupWithInvitesAction(formData);
    // Si hay error, el action retorna; si todo OK, hace redirect (no vuelve)
    if (result?.error) {
      setError(result.error);
      setStatus("error");
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        + Crear grupo
      </Button>
    );
  }

  const selectedNames = users.filter((u) => selectedIds.includes(u.id)).map((u) => u.name);
  const suggestedName =
    selectedNames.length > 0
      ? `${currentUserName} & ${selectedNames.join(", ")}`
      : "Nombre del grupo";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-lg">
        <h2 className="mb-1 text-base font-semibold text-foreground">Crear grupo</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Elegí con quién compartir gastos
        </p>

        <form action={handleSubmit}>
          <label className="mb-1.5 block text-xs text-foreground/70">
            Personas{" "}
            {selectedIds.length > 0 && (
              <span className="text-muted-foreground">({selectedIds.length})</span>
            )}
          </label>

          {users.length === 0 ? (
            <p className="mb-4 text-xs text-muted-foreground">
              No hay otros usuarios registrados todavía.
            </p>
          ) : (
            <div className="mb-4 max-h-48 overflow-y-auto rounded-lg border border-border">
              {users.map((u) => {
                const checked = selectedIds.includes(u.id);
                return (
                  <label
                    key={u.id}
                    className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2 last:border-b-0 hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      name="userIds"
                      value={u.id}
                      checked={checked}
                      onChange={() => toggle(u.id)}
                      className="sr-only"
                    />
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked
                          ? "border-sky-600 bg-sky-600 text-white"
                          : "border-input bg-background"
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <span className="text-sm text-foreground">{u.name}</span>
                  </label>
                );
              })}
            </div>
          )}

          <label className="mb-1 block text-xs text-foreground/70" htmlFor="group-name">
            Nombre del grupo <span className="text-muted-foreground">(opcional)</span>
          </label>
          <Input id="group-name" name="groupName" placeholder={suggestedName} maxLength={60} />
          {selectedIds.length > 0 && (
            <p className="mb-4 mt-1 text-xs text-muted-foreground">
              Si lo dejás vacío, usamos “{suggestedName}”.
            </p>
          )}
          {selectedIds.length === 0 && <div className="mb-4" />}

          {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={close}
              disabled={status === "pending"}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={status === "pending" || selectedIds.length === 0}
            >
              {status === "pending" ? "Creando…" : "Crear grupo"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
