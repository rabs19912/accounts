"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addLoanAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  const groupId = formData.get("groupId") as string;
  const toUserId = formData.get("toUserId") as string;
  const name = formData.get("name") as string;
  const amount = formData.get("amount") as string;
  const dateRaw = formData.get("date") as string;

  if (!name?.trim()) return { error: "El nombre es requerido" };
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
    return { error: "El monto debe ser mayor a 0" };

  const isMember = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
  });
  if (!isMember) return { error: "No pertenecés a este grupo" };

  if (toUserId === session.user.id) return { error: "No podés prestarte a vos mismo" };

  await db.loan.create({
    data: {
      groupId,
      fromUserId: session.user.id,
      toUserId,
      name: name.trim(),
      amount: Number(amount),
      date: dateRaw ? new Date(dateRaw) : null,
    },
  });

  revalidatePath(`/grupos/${groupId}`);
}

export async function deleteLoanAction(loanId: string, groupId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  const loan = await db.loan.findUnique({ where: { id: loanId } });
  if (!loan) return { error: "Préstamo no encontrado" };
  if (loan.fromUserId !== session.user.id)
    return { error: "Solo podés eliminar tus propios préstamos" };

  await db.loan.delete({ where: { id: loanId } });
  revalidatePath(`/grupos/${groupId}`);
}
