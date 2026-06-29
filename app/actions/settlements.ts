"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// El usuario actual registra que le pagó a otra persona del grupo.
// El balance se actualiza al instante y se notifica (informativo) al que cobra.
export async function registerPaymentAction(
  groupId: string,
  toUserId: string,
  amount: number,
  proofUrl?: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  if (!amount || isNaN(amount) || amount <= 0) return { error: "Monto inválido" };
  if (toUserId === session.user.id) return { error: "No podés pagarte a vos mismo" };

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });
  if (!group) return { error: "Grupo no encontrado" };

  const iAmMember = group.members.some((m) => m.userId === session.user!.id);
  const otherIsMember = group.members.some((m) => m.userId === toUserId);
  if (!iAmMember || !otherIsMember) return { error: "No pertenecés a este grupo" };

  await db.settlement.create({
    data: {
      groupId,
      paidById: session.user.id,
      receivedById: toUserId,
      amount,
      proofUrl: proofUrl ?? null,
      notifications: {
        create: { userId: toUserId, type: "PAYMENT_REGISTERED", groupId },
      },
    },
  });

  revalidatePath(`/grupos/${groupId}`);
  return { success: true };
}

// Borra un pago. Puede hacerlo quien pagó o quien cobró (para corregir errores).
export async function deletePaymentAction(settlementId: string, groupId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  const settlement = await db.settlement.findUnique({ where: { id: settlementId } });
  if (!settlement) return { error: "Pago no encontrado" };

  const involved =
    settlement.paidById === session.user.id || settlement.receivedById === session.user.id;
  if (!involved) return { error: "No podés borrar este pago" };

  await db.settlement.delete({ where: { id: settlementId } });
  revalidatePath(`/grupos/${groupId}`);
  return { success: true };
}

export async function updateMpAliasAction(mpAlias: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  const clean = mpAlias.trim();

  await db.user.update({
    where: { id: session.user.id },
    data: { mpAlias: clean || null },
  });

  revalidatePath("/perfil");
  return { success: true };
}
