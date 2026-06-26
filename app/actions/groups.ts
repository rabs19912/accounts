"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createGroupAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  const targetUserId = formData.get("userId") as string;
  if (!targetUserId) return { error: "Seleccioná un usuario" };

  const currentUser = await db.user.findUnique({ where: { id: session.user.id } });
  const targetUser = await db.user.findUnique({ where: { id: targetUserId } });

  if (!currentUser || !targetUser) return { error: "Usuario no encontrado" };

  const group = await db.group.create({
    data: {
      name: `${currentUser.name} & ${targetUser.name}`,
      members: {
        create: [{ userId: currentUser.id }, { userId: targetUser.id }],
      },
    },
  });

  redirect(`/grupos/${group.id}`);
}

export async function addExpenseAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  const groupId = formData.get("groupId") as string;
  const name = formData.get("name") as string;
  const price = formData.get("price") as string;
  const dateRaw = formData.get("date") as string;

  if (!name?.trim()) return { error: "El nombre es requerido" };
  if (!price || isNaN(Number(price)) || Number(price) <= 0)
    return { error: "El precio debe ser mayor a 0" };

  const isMember = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
  });
  if (!isMember) return { error: "No pertenecés a este grupo" };

  await db.expense.create({
    data: {
      groupId,
      userId: session.user.id,
      name: name.trim(),
      price: Number(price),
      date: dateRaw ? new Date(dateRaw) : null,
    },
  });

  revalidatePath(`/grupos/${groupId}`);
}
