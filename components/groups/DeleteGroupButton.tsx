"use client";

import { useState } from "react";
import { Trash2, Clock, X } from "lucide-react";
import { requestGroupDeletionAction, cancelGroupDeletionAction } from "@/app/actions/groups";
import { Button } from "@/components/ui/button";

interface Props {
  groupId: string;
  hasPendingDeletion: boolean;
}

export function DeleteGroupButton({ groupId, hasPendingDeletion }: Props) {
  const [pending, setPending] = useState(false);

  async function handleRequest() {
    if (!confirm("¿Solicitás eliminar el grupo? El otro miembro deberá confirmarlo.")) return;
    setPending(true);
    await requestGroupDeletionAction(groupId);
    setPending(false);
  }

  async function handleCancel() {
    setPending(true);
    await cancelGroupDeletionAction(groupId);
    setPending(false);
  }

  if (hasPendingDeletion) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-amber-600">
          <Clock className="h-4 w-4" />
          <span>Esperando confirmación del otro miembro</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={pending}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Cancelar solicitud
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleRequest}
      disabled={pending}
    >
      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
      {pending ? "Enviando…" : "Eliminar grupo"}
    </Button>
  );
}
