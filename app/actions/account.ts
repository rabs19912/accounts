"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function deleteAccountAction() {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  const userId = session.user.id;

  // Bloquear si es creador de grupos que tienen más miembros además de él.
  const createdGroups = await db.group.findMany({
    where: { createdById: userId },
    include: { _count: { select: { members: true } } },
  });
  const blocking = createdGroups.filter((g) => g._count.members > 1);

  if (blocking.length > 0) {
    const names = blocking.map((g) => g.name).join(", ");
    return {
      error: `Primero eliminá los grupos que creaste con otras personas: ${names}.`,
    };
  }

  // Borra el usuario; las relaciones en cascada limpian sus datos
  // (membresías, gastos, préstamos, pagos, notificaciones, grupos sin otros miembros).
  await db.user.delete({ where: { id: userId } });

  return { success: true };
}
