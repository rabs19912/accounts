import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user!;

  return (
    <div className="flex min-h-screen bg-sky-50">
      <Sidebar
        userName={user.name ?? ""}
        userEmail={user.email ?? ""}
        userInitials={getInitials(user.name ?? "?")}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar con campanita — visible en todas las páginas del dashboard */}
        <div className="flex items-center justify-end border-b border-gray-200 bg-white px-6 py-3 lg:px-8">
          <NotificationBell />
        </div>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
