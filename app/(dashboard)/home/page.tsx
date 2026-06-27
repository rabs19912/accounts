import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChevronRight } from "lucide-react";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import { computeNetTotals } from "@/lib/balance";
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
            loans: true,
          },
        },
      },
    }),
  ]);

  const groups = memberships.map(({ group }) => {
    const memberIds = group.members.map((m) => m.userId);
    const expenseInputs = group.expenses.map((e) => ({ userId: e.userId, price: Number(e.price) }));
    const loanInputs = group.loans.map((l) => ({
      fromUserId: l.fromUserId,
      toUserId: l.toUserId,
      amount: Number(l.amount),
    }));
    const netTotals = computeNetTotals(memberIds, expenseInputs, loanInputs);
    const balance = netTotals[userId] ?? 0;
    const totalExpenses = expenseInputs.reduce((s, e) => s + e.price, 0);
    const otherMembers = group.members.filter((m) => m.userId !== userId).map((m) => m.user);
    return { ...group, totalExpenses, balance, otherMembers };
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10 lg:px-8">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">Bienvenido</p>
        <h2 className="mt-1 text-3xl font-bold text-gray-900">
          Hola, {session?.user?.name} 👋
        </h2>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">Tus grupos</h3>
        <CreateGroupModal users={otherUsers} currentUserName={session?.user?.name ?? ""} />
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
                  {group.otherMembers.slice(0, 2).map((m, i) => (
                    <div
                      key={m.id}
                      className={`-ml-2 flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                        i === 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {getInitials(m.name)}
                    </div>
                  ))}
                  {group.otherMembers.length > 2 && (
                    <div className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                      +{group.otherMembers.length - 2}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{group.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.members.length} miembro{group.members.length !== 1 ? "s" : ""}
                    {group.totalExpenses > 0 ? ` · ${formatBalance(group.totalExpenses)}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {Math.abs(group.balance) >= 0.01 && (
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
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
