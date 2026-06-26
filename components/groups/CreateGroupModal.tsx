"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateGroup } from "@/hooks/useCreateGroup";

type User = { id: string; name: string; email: string };

export function CreateGroupModal({ users }: { users: User[] }) {
  const { open, setOpen, mode, setMode, status, error, sentTo, close, submit } =
    useCreateGroup();

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
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-lg">
        {status === "success" ? (
          <SuccessState email={sentTo!} onClose={close} />
        ) : (
          <FormState
            users={users}
            mode={mode}
            setMode={setMode}
            error={error}
            pending={status === "pending"}
            onSubmit={submit}
            onClose={close}
          />
        )}
      </div>
    </div>
  );
}

function SuccessState({ email, onClose }: { email: string; onClose: () => void }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
        <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="mb-1 text-base font-semibold text-foreground">Invitación enviada</h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Le mandamos un email a <span className="font-medium text-foreground">{email}</span> con
        el link para aceptar.
      </p>
      <Button size="sm" onClick={onClose} className="w-full">
        Cerrar
      </Button>
    </div>
  );
}

interface FormStateProps {
  users: User[];
  mode: "select" | "email";
  setMode: (m: "select" | "email") => void;
  error: string | null;
  pending: boolean;
  onSubmit: (formData: FormData) => void;
  onClose: () => void;
}

function FormState({ users, mode, setMode, error, pending, onSubmit, onClose }: FormStateProps) {
  return (
    <>
      <h2 className="mb-1 text-base font-semibold text-foreground">Crear grupo</h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Invitá a alguien para compartir gastos
      </p>

      <div className="mb-4 flex rounded-lg border border-border p-0.5">
        <button
          type="button"
          onClick={() => setMode("select")}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
            mode === "select"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Usuario registrado
        </button>
        <button
          type="button"
          onClick={() => setMode("email")}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
            mode === "email"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Invitar por email
        </button>
      </div>

      <form action={onSubmit}>
        {mode === "select" ? (
          <SelectMode users={users} />
        ) : (
          <EmailMode />
        )}

        {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Enviando…" : "Enviar invitación"}
          </Button>
        </div>
      </form>
    </>
  );
}

function SelectMode({ users }: { users: User[] }) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-xs text-foreground/70" htmlFor="user-select">
        Seleccioná un usuario
      </label>
      {users.length === 0 ? (
        <p className="text-xs text-muted-foreground">No hay otros usuarios registrados.</p>
      ) : (
        <select
          id="user-select"
          name="email"
          required
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Elegí un usuario…</option>
          {users.map((u) => (
            <option key={u.id} value={u.email}>
              {u.name} — {u.email}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function EmailMode() {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-xs text-foreground/70" htmlFor="email-input">
        Email
      </label>
      <Input
        id="email-input"
        name="email"
        type="email"
        placeholder="juan@ejemplo.com"
        required
      />
      <p className="mt-1.5 text-xs text-muted-foreground">
        Si no tiene cuenta, el link lo va a llevar a registrarse primero.
      </p>
    </div>
  );
}
