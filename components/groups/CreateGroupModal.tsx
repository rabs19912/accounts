"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendInvitationAction } from "@/app/actions/invitations";

type User = { id: string; name: string; email: string };
type Status = "idle" | "pending" | "success" | "error";

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
  const [inviteeName, setInviteeName] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");

  function close() {
    setOpen(false);
    setTimeout(() => {
      setStatus("idle");
      setError(null);
      setInviteeName(null);
      setSelectedId("");
    }, 300);
  }

  async function handleSubmit(formData: FormData) {
    setStatus("pending");
    setError(null);

    const userId = formData.get("userId") as string;
    const selected = users.find((u) => u.id === userId);

    const result = await sendInvitationAction(formData);

    if (result?.error) {
      setError(result.error);
      setStatus("error");
      return;
    }

    setInviteeName(selected?.name ?? null);
    setStatus("success");
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        + Crear grupo
      </Button>
    );
  }

  const selectedUser = users.find((u) => u.id === selectedId);
  const suggestedName = selectedUser
    ? `${currentUserName} & ${selectedUser.name}`
    : "Nombre del grupo";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-lg">
        {status === "success" ? (
          <SuccessState name={inviteeName!} onClose={close} />
        ) : (
          <FormState
            users={users}
            error={error}
            pending={status === "pending"}
            selectedId={selectedId}
            onSelectUser={setSelectedId}
            suggestedName={suggestedName}
            hasSelection={!!selectedUser}
            onSubmit={handleSubmit}
            onClose={close}
          />
        )}
      </div>
    </div>
  );
}

function SuccessState({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
        <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="mb-1 text-base font-semibold text-foreground">Invitación enviada</h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Le enviamos una notificación a{" "}
        <span className="font-medium text-foreground">{name}</span>. Cuando acepte, el grupo
        se va a crear automáticamente.
      </p>
      <Button size="sm" onClick={onClose} className="w-full">
        Cerrar
      </Button>
    </div>
  );
}

function FormState({
  users,
  error,
  pending,
  selectedId,
  onSelectUser,
  suggestedName,
  hasSelection,
  onSubmit,
  onClose,
}: {
  users: User[];
  error: string | null;
  pending: boolean;
  selectedId: string;
  onSelectUser: (id: string) => void;
  suggestedName: string;
  hasSelection: boolean;
  onSubmit: (formData: FormData) => void;
  onClose: () => void;
}) {
  return (
    <>
      <h2 className="mb-1 text-base font-semibold text-foreground">Crear grupo</h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Invitá a alguien para compartir gastos
      </p>

      <form action={onSubmit}>
        <label className="mb-1 block text-xs text-foreground/70" htmlFor="user-select">
          Seleccioná un usuario
        </label>

        {users.length === 0 ? (
          <p className="mb-4 text-xs text-muted-foreground">
            No hay otros usuarios registrados todavía.
          </p>
        ) : (
          <select
            id="user-select"
            name="userId"
            required
            value={selectedId}
            onChange={(e) => onSelectUser(e.target.value)}
            className="mb-4 h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Elegí un usuario…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        )}

        <label className="mb-1 block text-xs text-foreground/70" htmlFor="group-name">
          Nombre del grupo <span className="text-muted-foreground">(opcional)</span>
        </label>
        <Input
          id="group-name"
          name="groupName"
          placeholder={suggestedName}
          maxLength={60}
        />
        {hasSelection && (
          <p className="mb-4 mt-1 text-xs text-muted-foreground">
            Si lo dejás vacío, usamos “{suggestedName}”.
          </p>
        )}
        {!hasSelection && <div className="mb-4" />}

        {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={pending || users.length === 0}>
            {pending ? "Enviando…" : "Enviar invitación"}
          </Button>
        </div>
      </form>
    </>
  );
}
