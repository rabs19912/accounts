import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { acceptInvitationAction } from "@/app/actions/invitations";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitationPage({ params }: Props) {
  const { token } = await params;

  const invitation = await db.invitation.findUnique({ where: { token } });

  if (!invitation || invitation.status === "EXPIRED") {
    return <InvitationError message="Esta invitación no existe o ya expiró." />;
  }

  if (invitation.status === "ACCEPTED") {
    return (
      <InvitationError message="Esta invitación ya fue aceptada." showGroupLink={invitation.groupId} />
    );
  }

  if (invitation.expiresAt < new Date()) {
    await db.invitation.update({ where: { token }, data: { status: "EXPIRED" } });
    return <InvitationError message="Esta invitación expiró. Pedile al invitador que te mande una nueva." />;
  }

  const inviter = await db.user.findUnique({ where: { id: invitation.inviterId } });
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/invitaciones/${token}`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sky-50 px-6">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100">
          <svg className="h-6 w-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 className="mb-1 text-lg font-semibold text-gray-900">Invitación de grupo</h1>
        <p className="mb-1 text-sm text-muted-foreground">
          <span className="font-medium text-gray-900">{inviter?.name}</span> te invitó a compartir gastos
        </p>
        <p className="mb-6 text-sm font-medium text-sky-600">{invitation.groupName}</p>

        <form
          action={async () => {
            "use server";
            await acceptInvitationAction(token);
          }}
        >
          <Button type="submit" className="w-full">
            Aceptar invitación
          </Button>
        </form>

        <Link href="/home" className="mt-3 block text-xs text-muted-foreground hover:text-foreground">
          Rechazar
        </Link>
      </div>
    </div>
  );
}

function InvitationError({
  message,
  showGroupLink,
}: {
  message: string;
  showGroupLink?: string | null;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sky-50 px-6">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="mb-2 text-base font-semibold text-gray-900">Invitación inválida</h1>
        <p className="mb-5 text-sm text-muted-foreground">{message}</p>
        {showGroupLink ? (
          <Link href={`/grupos/${showGroupLink}`}>
            <Button size="sm">Ver el grupo</Button>
          </Link>
        ) : (
          <Link href="/home">
            <Button size="sm" variant="outline">Ir al inicio</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
