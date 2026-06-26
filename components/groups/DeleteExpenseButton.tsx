"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteExpenseAction } from "@/app/actions/groups";

export function DeleteExpenseButton({
  expenseId,
  groupId,
  isOwner,
}: {
  expenseId: string;
  groupId: string;
  isOwner: boolean;
}) {
  const [pending, setPending] = useState(false);

  if (!isOwner) return null;

  async function handleDelete() {
    if (!confirm("¿Eliminás este gasto?")) return;
    setPending(true);
    await deleteExpenseAction(expenseId, groupId);
    setPending(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="ml-2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 disabled:opacity-50"
      aria-label="Eliminar gasto"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
