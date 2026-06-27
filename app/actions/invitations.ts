"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateToken, getExpiresAt } from "@/lib/tokens";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Crea el grupo inmediatamente (con el creador como único miembro confirmado)
// y manda una invitación a cada usuario seleccionado.
export async function createGroupWithInvitesAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  const targetUserIds = formData.getAll("userIds") as string[];
  const customName = (formData.get("groupName") as string)?.trim();

  const cleanIds = [...new Set(targetUserIds.filter((id) => id && id !== session.user!.id))];
  if (cleanIds.length === 0) return { error: "Seleccioná al menos una persona" };

  const inviter = await db.user.findUnique({ where: { id: session.user.id } });
  if (!inviter) return { error: "Usuario no encontrado" };

  const invitees = await db.user.findMany({ where: { id: { in: cleanIds } } });
  if (invitees.length === 0) return { error: "Usuarios no encontrados" };

  const suggestedName =
    `${inviter.name} & ${invitees.map((u) => u.name).join(", ")}`.slice(0, 60);
  const groupName = customName || suggestedName;

  const group = await db.group.create({
    data: {
      name: groupName,
      createdById: inviter.id,
      members: { create: [{ userId: inviter.id }] },
    },
  });

  await Promise.all(
    invitees.map((invitee) =>
      db.invitation.create({
        data: {
          token: generateToken(),
          inviterId: inviter.id,
          email: invitee.email,
          groupName,
          groupId: group.id,
          expiresAt: getExpiresAt(24 * 7),
          notifications: {
            create: { userId: invitee.id, type: "INVITATION_RECEIVED" },
          },
        },
      })
    )
  );

  redirect(`/grupos/${group.id}`);
}

// El creador suma más gente a un grupo ya existente.
export async function inviteToGroupAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  const groupId = formData.get("groupId") as string;
  const targetUserIds = formData.getAll("userIds") as string[];

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });
  if (!group) return { error: "Grupo no encontrado" };

  const isMember = group.members.some((m) => m.userId === session.user!.id);
  if (!isMember) return { error: "No pertenecés a este grupo" };

  const inviter = await db.user.findUnique({ where: { id: session.user.id } });
  if (!inviter) return { error: "Usuario no encontrado" };

  const memberIds = new Set(group.members.map((m) => m.userId));
  const cleanIds = [...new Set(targetUserIds.filter((id) => id && !memberIds.has(id)))];
  if (cleanIds.length === 0) return { error: "Seleccioná a alguien que no esté en el grupo" };

  // Evitar invitaciones duplicadas pendientes
  const pending = await db.invitation.findMany({
    where: { groupId, status: "PENDING" },
    include: { notifications: true },
  });
  const alreadyInvited = new Set(
    pending.flatMap((inv) => inv.notifications.map((n) => n.userId))
  );

  const toInvite = cleanIds.filter((id) => !alreadyInvited.has(id));
  if (toInvite.length === 0) return { error: "Ya tienen invitación pendiente" };

  const invitees = await db.user.findMany({ where: { id: { in: toInvite } } });

  await Promise.all(
    invitees.map((invitee) =>
      db.invitation.create({
        data: {
          token: generateToken(),
          inviterId: inviter.id,
          email: invitee.email,
          groupName: group.name,
          groupId: group.id,
          expiresAt: getExpiresAt(24 * 7),
          notifications: {
            create: { userId: invitee.id, type: "INVITATION_RECEIVED" },
          },
        },
      })
    )
  );

  revalidatePath(`/grupos/${groupId}`);
  return { success: true, count: invitees.length };
}

export async function respondInvitationAction(
  invitationId: string,
  response: "accept" | "reject"
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
    include: { inviter: true },
  });

  if (!invitation) return { error: "Invitación no encontrada" };
  if (invitation.status !== "PENDING") return { error: "Esta invitación ya fue respondida" };
  if (invitation.expiresAt < new Date()) return { error: "La invitación expiró" };
  if (!invitation.groupId) return { error: "El grupo ya no existe" };

  if (response === "accept") {
    // Sumar al usuario como miembro del grupo existente (idempotente)
    await db.groupMember.upsert({
      where: { groupId_userId: { groupId: invitation.groupId, userId: session.user.id } },
      create: { groupId: invitation.groupId, userId: session.user.id },
      update: {},
    });

    await db.invitation.update({
      where: { id: invitationId },
      data: { status: "ACCEPTED" },
    });

    await db.notification.deleteMany({ where: { invitationId, userId: session.user.id } });

    await db.notification.create({
      data: {
        userId: invitation.inviterId,
        type: "INVITATION_ACCEPTED",
        invitationId,
      },
    });

    redirect(`/grupos/${invitation.groupId}`);
  } else {
    await db.invitation.update({
      where: { id: invitationId },
      data: { status: "EXPIRED" },
    });

    await db.notification.deleteMany({ where: { invitationId, userId: session.user.id } });

    await db.notification.create({
      data: {
        userId: invitation.inviterId,
        type: "INVITATION_REJECTED",
        invitationId,
      },
    });

    return { success: true };
  }
}

export async function dismissNotificationAction(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  await db.notification.deleteMany({
    where: { id: notificationId, userId: session.user.id },
  });
}
