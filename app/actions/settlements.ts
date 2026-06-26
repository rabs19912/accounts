"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function settleBalanceAction(groupId: string, amount: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });
  if (!group) return { error: "Grupo no encontrado" };

  const isMember = group.members.some((m) => m.userId === session.user!.id);
  if (!isMember) return { error: "No pertenecés a este grupo" };

  const otherMemberId = group.members.find((m) => m.userId !== session.user!.id)?.userId;
  if (!otherMemberId) return { error: "No se encontró al otro miembro" };

  await db.$transaction(async (tx) => {
    const settlement = await tx.settlement.create({
      data: {
        groupId,
        paidById: session.user!.id!,
        receivedById: otherMemberId,
        amount,
      },
    });

    await tx.expense.updateMany({
      where: { groupId, settlementId: null },
      data: { settlementId: settlement.id },
    });

    await tx.loan.updateMany({
      where: { groupId, settlementId: null },
      data: { settlementId: settlement.id },
    });
  });

  revalidatePath(`/grupos/${groupId}`);
}

export async function updateMpAliasAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;

  const mpAlias = (formData.get("mpAlias") as string)?.trim();

  await db.user.update({
    where: { id: session.user.id },
    data: { mpAlias: mpAlias || null },
  });

  revalidatePath("/perfil");
}
