"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateGroupNameAction } from "@/app/actions/groups";
import { useRouter } from "next/navigation";

interface Props {
  groupId: string;
  currentName: string;
  canEdit: boolean;
}

export function EditGroupName({ groupId, currentName, canEdit }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  if (!canEdit) {
    return <h1 className="text-xl font-semibold text-gray-900">{currentName}</h1>;
  }

  function openModal() {
    setName(currentName);
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await updateGroupNameAction(groupId, name);
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
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold text-gray-900">{currentName}</h1>
        <button
          onClick={openModal}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Editar nombre del grupo"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-lg">
            <h2 className="mb-1 text-base font-semibold text-foreground">Editar nombre</h2>
            <p className="mb-5 text-sm text-muted-foreground">
              Cambiá el nombre de este grupo
            </p>

            <form onSubmit={handleSubmit}>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                autoFocus
                className="mb-1"
              />
              {error && <p className="mb-3 mt-1 text-xs text-destructive">{error}</p>}
              <div className="mt-4 flex justify-end gap-2">
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
                  {pending ? "Guardando…" : "Guardar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
