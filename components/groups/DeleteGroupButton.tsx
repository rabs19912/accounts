"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteGroupAction } from "@/app/actions/groups";
import { Button } from "@/components/ui/button";

interface Props {
  groupId: string;
  canDelete: boolean;
}

export function DeleteGroupButton({ groupId, canDelete }: Props) {
  const [pending, setPending] = useState(false);

  if (!canDelete) return null;

  async function handleDelete() {
    if (!confirm("¿Eliminás el grupo? Se borran todos los gastos, préstamos y miembros.")) return;
    setPending(true);
    await deleteGroupAction(groupId);
    setPending(false);
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={pending}>
      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
      {pending ? "Eliminando…" : "Eliminar grupo"}
    </Button>
  );
}
