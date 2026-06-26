"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendInvitationEmail } from "@/lib/email";
import { generateToken, getExpiresAt } from "@/lib/tokens";
import { redirect } from "next/navigation";

export async function sendInvitationAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) return { error: "El email es requerido" };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { error: "Email inválido" };

  if (email === session.user.email?.toLowerCase())
    return { error: "No podés invitarte a vos mismo" };

  const inviter = await db.user.findUnique({ where: { id: session.user.id } });
  if (!inviter) return { error: "Usuario no encontrado" };

  const invitee = await db.user.findUnique({ where: { email } });
  const groupName = `${inviter.name} & ${invitee?.name ?? email.split("@")[0]}`;

  const token = generateToken();

  await db.invitation.create({
    data: {
      token,
      inviterId: inviter.id,
      email,
      groupName,
      expiresAt: getExpiresAt(24),
    },
  });

  try {
    await sendInvitationEmail({
      to: email,
      inviterName: inviter.name,
      groupName,
      token,
    });
  } catch {
    await db.invitation.deleteMany({ where: { token } });
    return { error: "No se pudo enviar el email. Intentá de nuevo." };
  }

  return { success: true, email };
}

export async function acceptInvitationAction(token: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  const invitation = await db.invitation.findUnique({ where: { token } });

  if (!invitation) return { error: "Invitación no encontrada" };
  if (invitation.status === "ACCEPTED") return { error: "Esta invitación ya fue aceptada" };
  if (invitation.status === "EXPIRED" || invitation.expiresAt < new Date())
    return { error: "Esta invitación expiró" };

  const invitee = await db.user.findUnique({ where: { id: session.user.id } });
  if (!invitee) return { error: "Usuario no encontrado" };

  const groupName = `${(await db.user.findUnique({ where: { id: invitation.inviterId } }))?.name} & ${invitee.name}`;

  const group = await db.group.create({
    data: {
      name: groupName,
      members: {
        create: [
          { userId: invitation.inviterId },
          { userId: session.user.id },
        ],
      },
    },
  });

  await db.invitation.update({
    where: { token },
    data: { status: "ACCEPTED", groupId: group.id },
  });

  redirect(`/grupos/${group.id}`);
}
