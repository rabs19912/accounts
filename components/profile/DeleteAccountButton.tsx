"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { deleteAccountAction } from "@/app/actions/account";

export function DeleteAccountButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (
      !confirm(
        "¿Eliminar tu cuenta? Esta acción es irreversible y borra todos tus datos."
      )
    )
      return;

    setPending(true);
    setError(null);
    const result = await deleteAccountAction();

    if (result?.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    await signOut({ callbackUrl: "/login" });
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        {pending ? "Eliminando…" : "Eliminar mi cuenta"}
      </button>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
