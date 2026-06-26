"use client";

import { useState } from "react";
import { deleteGroupAction } from "@/app/actions/groups";
import { Button } from "@/components/ui/button";

export function DeleteGroupButton({ groupId }: { groupId: string }) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Eliminás el grupo? Se van a borrar todos los gastos.")) return;
    setPending(true);
    await deleteGroupAction(groupId);
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={pending}
    >
      {pending ? "Eliminando…" : "Eliminar grupo"}
    </Button>
  );
}
