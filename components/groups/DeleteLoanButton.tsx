"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteLoanAction } from "@/app/actions/loans";

export function DeleteLoanButton({
  loanId,
  groupId,
  isOwner,
}: {
  loanId: string;
  groupId: string;
  isOwner: boolean;
}) {
  const [pending, setPending] = useState(false);

  if (!isOwner) return null;

  async function handleDelete() {
    if (!confirm("¿Eliminás este préstamo?")) return;
    setPending(true);
    await deleteLoanAction(loanId, groupId);
    setPending(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="ml-2 rounded p-1 text-gray-400 transition-colors hover:text-destructive disabled:opacity-50"
      aria-label="Eliminar préstamo"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
