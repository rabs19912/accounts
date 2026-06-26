import { Resend } from "resend";
import { InvitationEmail } from "@/emails/InvitationEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "onboarding@resend.dev";

interface SendInvitationParams {
  to: string;
  inviterName: string;
  groupName: string;
  token: string;
}

export async function sendInvitationEmail({
  to,
  inviterName,
  groupName,
  token,
}: SendInvitationParams) {
  const acceptUrl = `${process.env.NEXTAUTH_URL}/invitaciones/${token}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `${inviterName} te invitó a compartir gastos`,
    react: InvitationEmail({ inviterName, groupName, acceptUrl }),
  });

  if (error) throw new Error(error.message);
}
