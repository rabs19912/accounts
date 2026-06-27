"use client";

import { useState } from "react";
import { Check, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inviteToGroupAction } from "@/app/actions/invitations";
import { useRouter } from "next/navigation";

type User = { id: string; name: string };

export function InviteMembersModal({
  groupId,
  availableUsers,
}: {
  groupId: string;
  availableUsers: User[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  function close() {
    setOpen(false);
    setTimeout(() => {
      setSelectedIds([]);
      setError(null);
    }, 250);
  }

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await inviteToGroupAction(formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    setPending(false);
    close();
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" variant="outline">
        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
        Invitar
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-lg">
            <h2 className="mb-1 text-base font-semibold text-foreground">Invitar al grupo</h2>
            <p className="mb-5 text-sm text-muted-foreground">
              Sumá más personas para compartir gastos
            </p>

            <form action={handleSubmit}>
              <input type="hidden" name="groupId" value={groupId} />

              {availableUsers.length === 0 ? (
                <p className="mb-4 text-xs text-muted-foreground">
                  No hay más usuarios para invitar.
                </p>
              ) : (
                <div className="mb-4 max-h-48 overflow-y-auto rounded-lg border border-border">
                  {availableUsers.map((u) => {
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

              {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={close} disabled={pending}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={pending || selectedIds.length === 0}>
                  {pending ? "Invitando…" : "Enviar invitaciones"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
