"use client";

import { useState } from "react";
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
      className="ml-2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 disabled:opacity-50"
      aria-label="Eliminar préstamo"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}
