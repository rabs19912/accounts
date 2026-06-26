"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateToken, getExpiresAt } from "@/lib/tokens";
import { redirect } from "next/navigation";

export async function sendInvitationAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  const targetUserId = formData.get("userId") as string;
  if (!targetUserId) return { error: "Seleccioná un usuario" };
  if (targetUserId === session.user.id) return { error: "No podés invitarte a vos mismo" };

  const [inviter, invitee] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id } }),
    db.user.findUnique({ where: { id: targetUserId } }),
  ]);

  if (!inviter || !invitee) return { error: "Usuario no encontrado" };

  const existing = await db.invitation.findFirst({
    where: {
      inviterId: inviter.id,
      status: "PENDING",
      notifications: { some: { userId: invitee.id } },
    },
  });
  if (existing) return { error: `Ya tenés una invitación pendiente para ${invitee.name}` };

  const invitation = await db.invitation.create({
    data: {
      token: generateToken(),
      inviterId: inviter.id,
      email: invitee.email,
      groupName: `${inviter.name} & ${invitee.name}`,
      expiresAt: getExpiresAt(24 * 7),
      notifications: {
        create: { userId: invitee.id, type: "INVITATION_RECEIVED" },
      },
    },
  });

  return { success: true, invitationId: invitation.id };
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

  const invitee = await db.user.findUnique({ where: { id: session.user.id } });
  if (!invitee) return { error: "Usuario no encontrado" };

  if (response === "accept") {
    const group = await db.group.create({
      data: {
        name: `${invitation.inviter.name} & ${invitee.name}`,
        members: {
          create: [{ userId: invitation.inviterId }, { userId: session.user.id }],
        },
      },
    });

    await db.invitation.update({
      where: { id: invitationId },
      data: { status: "ACCEPTED", groupId: group.id },
    });

    await db.notification.deleteMany({ where: { invitationId, userId: session.user.id } });

    await db.notification.create({
      data: {
        userId: invitation.inviterId,
        type: "INVITATION_ACCEPTED",
        invitationId,
      },
    });

    redirect(`/grupos/${group.id}`);
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
