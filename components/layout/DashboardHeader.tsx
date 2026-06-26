import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { LogOut, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  backHref?: string;
  title?: string;
  actions?: React.ReactNode;
}

export async function DashboardHeader({ backHref, title, actions }: Props) {
  return (
    <header className="border-b bg-white px-6 py-4 shadow-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div className="flex items-center gap-2">
          {backHref ? (
            <Link href={backHref}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <span className="text-xl font-bold text-sky-600">Accounts</span>
          )}
          {title && (
            <h1 className="text-base font-semibold text-gray-900">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-1">
          {actions}
          <NotificationBell />
          {!backHref && (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button variant="ghost" size="icon" type="submit" aria-label="Cerrar sesión">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
