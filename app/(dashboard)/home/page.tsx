import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import Link from "next/link";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatBalance(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
}

export default async function HomePage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [otherUsers, memberships] = await Promise.all([
    db.user.findMany({
      where: { id: { not: userId } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    db.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            members: { include: { user: { select: { id: true, name: true } } } },
            expenses: true,
          },
        },
      },
    }),
  ]);

  const groups = memberships.map(({ group }) => {
    const totalExpenses = group.expenses.reduce(
      (sum, e) => sum + Number(e.price),
      0
    );
    const myExpenses = group.expenses
      .filter((e) => e.userId === userId)
      .reduce((sum, e) => sum + Number(e.price), 0);
    const share = totalExpenses / 2;
    const balance = myExpenses - share;
    const otherMember = group.members.find((m) => m.userId !== userId)?.user;

    return { ...group, totalExpenses, balance, otherMember };
  });

  return (
    <div className="flex min-h-screen flex-col bg-sky-50">
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-xl font-bold text-sky-600">Accounts</h1>
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">Bienvenido</p>
          <h2 className="mt-1 text-3xl font-bold text-gray-900">
            Hola, {session?.user?.name} 👋
          </h2>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800">Tus grupos</h3>
          <CreateGroupModal users={otherUsers} />
        </div>

        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Todavía no tenés grupos. Creá uno para empezar.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/grupos/${group.id}`}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-medium text-sky-700">
                      {getInitials(session?.user?.name ?? "")}
                    </div>
                    <div className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-medium text-emerald-700">
                      {getInitials(group.otherMember?.name ?? "?")}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.expenses.length} gasto{group.expenses.length !== 1 ? "s" : ""}
                      {group.totalExpenses > 0
                        ? ` · ${formatBalance(group.totalExpenses)}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {group.balance !== 0 && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        group.balance > 0
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {group.balance > 0 ? "+" : "−"}
                      {formatBalance(group.balance)}
                    </span>
                  )}
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
