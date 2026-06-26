import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AddExpenseModal } from "@/components/groups/AddExpenseModal";
import { DeleteExpenseButton } from "@/components/groups/DeleteExpenseButton";
import { DeleteGroupButton } from "@/components/groups/DeleteGroupButton";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date | null) {
  if (!date) return "sin fecha";
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(
    new Date(date)
  );
}

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id!;

  const group = await db.group.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } },
      expenses: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!group) notFound();

  const isMember = group.members.some((m) => m.userId === userId);
  if (!isMember) notFound();

  const totalExpenses = group.expenses.reduce((sum, e) => sum + Number(e.price), 0);
  const share = totalExpenses / 2;

  const memberBalances = group.members.map((m) => {
    const spent = group.expenses
      .filter((e) => e.userId === m.userId)
      .reduce((sum, e) => sum + Number(e.price), 0);
    return { ...m.user, spent, balance: spent - share };
  });

  const me = memberBalances.find((m) => m.id === userId)!;
  const other = memberBalances.find((m) => m.id !== userId)!;

  const balanceLabel =
    me.balance > 0
      ? `${other.name} te debe ${formatCurrency(me.balance)}`
      : me.balance < 0
        ? `Le debés ${formatCurrency(Math.abs(me.balance))} a ${other.name}`
        : "Están al día";

  const balanceColor =
    me.balance > 0
      ? "bg-emerald-50 text-emerald-700"
      : me.balance < 0
        ? "bg-red-50 text-red-600"
        : "bg-gray-50 text-gray-600";

  return (
    <div className="flex min-h-screen flex-col bg-sky-50">
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/home">
              <Button variant="ghost" size="icon">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
            </Link>
            <h1 className="text-base font-semibold text-gray-900">{group.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <AddExpenseModal groupId={group.id} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-muted-foreground">Total gastos</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div className={`rounded-xl border p-4 ${balanceColor} border-transparent`}>
            <p className="text-xs opacity-70">Balance</p>
            <p className="mt-1 text-sm font-medium leading-tight">{balanceLabel}</p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <p className="mb-3 text-xs font-medium text-muted-foreground">Desglose por persona</p>
          <div className="flex flex-col gap-2">
            {memberBalances.map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                      m.id === userId ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {getInitials(m.name)}
                  </div>
                  <span className="text-sm text-gray-700">
                    {m.id === userId ? "Vos" : m.name}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(m.spent)}</p>
                  <p className="text-xs text-muted-foreground">parte: {formatCurrency(share)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <p className="mb-3 text-xs font-medium text-muted-foreground">
            Gastos ({group.expenses.length})
          </p>

          {group.expenses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Todavía no hay gastos. ¡Agregá el primero!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {group.expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                        expense.userId === userId
                          ? "bg-sky-100 text-sky-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {getInitials(expense.user.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{expense.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(expense.date)} · {expense.user.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(Number(expense.price))}
                    </p>
                    <DeleteExpenseButton
                      expenseId={expense.id}
                      groupId={group.id}
                      isOwner={expense.userId === userId}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <DeleteGroupButton groupId={group.id} />
        </div>
      </main>
    </div>
  );
}
