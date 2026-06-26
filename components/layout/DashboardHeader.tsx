import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import Link from "next/link";

interface Props {
  backHref?: string;
  title?: string;
  actions?: React.ReactNode;
}

export async function DashboardHeader({ backHref, title, actions }: Props) {
  const session = await auth();

  return (
    <header className="border-b bg-white px-6 py-4 shadow-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div className="flex items-center gap-3">
          {backHref ? (
            <Link href={backHref}>
              <Button variant="ghost" size="icon">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
            </Link>
          ) : (
            <span className="text-xl font-bold text-sky-600">Accounts</span>
          )}
          {title && (
            <h1 className="text-base font-semibold text-gray-900">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actions}
          <NotificationBell />
          {!backHref && (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button variant="ghost" size="sm" type="submit">
                Cerrar sesión
              </Button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
