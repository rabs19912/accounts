"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function updateGroupNameAction(groupId: string, name: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "El nombre no puede estar vacío" };
  if (trimmed.length > 60) return { error: "El nombre es demasiado largo" };

  const group = await db.group.findUnique({ where: { id: groupId } });
  if (!group) return { error: "Grupo no encontrado" };
  if (group.createdById !== session.user.id)
    return { error: "Solo quien creó el grupo puede cambiar el nombre" };

  await db.group.update({ where: { id: groupId }, data: { name: trimmed } });
  revalidatePath(`/grupos/${groupId}`);
  return { success: true };
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

export async function deleteExpenseAction(expenseId: string, groupId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  const expense = await db.expense.findUnique({ where: { id: expenseId } });
  if (!expense) return { error: "Gasto no encontrado" };
  if (expense.userId !== session.user.id) return { error: "Solo podés eliminar tus propios gastos" };

  await db.expense.delete({ where: { id: expenseId } });
  revalidatePath(`/grupos/${groupId}`);
}

export async function deleteGroupAction(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  const group = await db.group.findUnique({ where: { id: groupId } });
  if (!group) return { error: "Grupo no encontrado" };
  if (group.createdById !== session.user.id)
    return { error: "Solo quien creó el grupo puede eliminarlo" };

  await db.group.delete({ where: { id: groupId } });
  redirect("/home");
}

export async function requestGroupDeletionAction(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { members: true, notifications: { where: { type: "GROUP_DELETE_REQUEST" } } },
  });
  if (!group) return { error: "Grupo no encontrado" };

  const isMember = group.members.some((m) => m.userId === session.user!.id);
  if (!isMember) return { error: "No pertenecés a este grupo" };

  if (group.notifications.length > 0) return { error: "Ya hay una solicitud de eliminación pendiente" };

  const otherMemberId = group.members.find((m) => m.userId !== session.user!.id)?.userId;
  if (!otherMemberId) return { error: "No se encontró al otro miembro" };

  await db.notification.create({
    data: {
      userId: otherMemberId,
      type: "GROUP_DELETE_REQUEST",
      groupId,
    },
  });

  revalidatePath(`/grupos/${groupId}`);
}

export async function cancelGroupDeletionAction(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  await db.notification.deleteMany({
    where: { groupId, type: "GROUP_DELETE_REQUEST" },
  });

  revalidatePath(`/grupos/${groupId}`);
}

export async function respondGroupDeletionAction(
  notificationId: string,
  groupId: string,
  response: "accept" | "reject"
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  const notification = await db.notification.findUnique({
    where: { id: notificationId },
    include: { group: { include: { members: true } } },
  });
  if (!notification?.group) return { error: "Notificación no encontrada" };

  const requesterId = notification.group.members.find(
    (m) => m.userId !== session.user!.id
  )?.userId;

  await db.notification.delete({ where: { id: notificationId } });

  if (response === "accept") {
    if (requesterId) {
      await db.notification.create({
        data: { userId: requesterId, type: "GROUP_DELETE_ACCEPTED", groupId },
      });
    }
    await db.group.delete({ where: { id: groupId } });
    redirect("/home");
  } else {
    if (requesterId) {
      await db.notification.create({
        data: { userId: requesterId, type: "GROUP_DELETE_REJECTED", groupId },
      });
    }
    return { success: true };
  }
}
