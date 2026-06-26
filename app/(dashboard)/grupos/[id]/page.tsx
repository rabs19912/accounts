import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { DeleteExpenseButton } from "@/components/groups/DeleteExpenseButton";
import { DeleteLoanButton } from "@/components/groups/DeleteLoanButton";
import { DeleteGroupButton } from "@/components/groups/DeleteGroupButton";
import { AddItemFAB } from "@/components/groups/AddItemFAB";

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
      loans: {
        include: {
          fromUser: { select: { id: true, name: true } },
          toUser: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      notifications: { where: { type: "GROUP_DELETE_REQUEST" } },
    },
  });

  if (!group) notFound();

  const isMember = group.members.some((m) => m.userId === userId);
  if (!isMember) notFound();

  const hasPendingDeletion = group.notifications.length > 0;
  const otherMember = group.members.find((m) => m.userId !== userId)!.user;

  // Balance de gastos: cada uno paga la mitad del total
  const totalExpenses = group.expenses.reduce((sum, e) => sum + Number(e.price), 0);
  const myExpenses = group.expenses
    .filter((e) => e.userId === userId)
    .reduce((sum, e) => sum + Number(e.price), 0);
  const balanceExpenses = myExpenses - totalExpenses / 2;

  // Balance de préstamos: lo que di menos lo que recibí (monto completo, sin dividir)
  const totalLoansGiven = group.loans
    .filter((l) => l.fromUserId === userId)
    .reduce((sum, l) => sum + Number(l.amount), 0);
  const totalLoansReceived = group.loans
    .filter((l) => l.toUserId === userId)
    .reduce((sum, l) => sum + Number(l.amount), 0);
  const balanceLoans = totalLoansGiven - totalLoansReceived;

  const totalLoans = group.loans.reduce((sum, l) => sum + Number(l.amount), 0);
  const balanceTotal = balanceExpenses + balanceLoans;

  const balanceLabel =
    balanceTotal > 0
      ? `${otherMember.name} te debe ${formatCurrency(balanceTotal)}`
      : balanceTotal < 0
        ? `Le debés ${formatCurrency(Math.abs(balanceTotal))} a ${otherMember.name}`
        : "Están al día";

  const balanceBg =
    balanceTotal > 0
      ? "bg-emerald-50 border-emerald-100 text-emerald-700"
      : balanceTotal < 0
        ? "bg-red-50 border-red-100 text-red-600"
        : "bg-gray-50 border-gray-100 text-gray-600";

  return (
    <div className="relative">
      <div className="mx-auto w-full max-w-2xl px-6 py-8">
        <h1 className="mb-6 text-xl font-semibold text-gray-900">{group.name}</h1>

        {/* Cards de resumen */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-muted-foreground">Gastos</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-muted-foreground">Préstamos</p>
            <p className="mt-1 text-xl font-semibold text-violet-600">
              {formatCurrency(totalLoans)}
            </p>
          </div>
          <div className={`rounded-xl border p-4 ${balanceBg}`}>
            <p className="text-xs opacity-70">Balance</p>
            <p className="mt-1 text-sm font-medium leading-tight">{balanceLabel}</p>
          </div>
        </div>

        {/* Desglose por persona */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <p className="mb-3 text-xs font-medium text-muted-foreground">Desglose</p>
          {group.members.map((m) => {
            const spent = group.expenses
              .filter((e) => e.userId === m.userId)
              .reduce((sum, e) => sum + Number(e.price), 0);
            const given = group.loans
              .filter((l) => l.fromUserId === m.userId)
              .reduce((sum, l) => sum + Number(l.amount), 0);
            const received = group.loans
              .filter((l) => l.toUserId === m.userId)
              .reduce((sum, l) => sum + Number(l.amount), 0);
            const balance =
              (spent - totalExpenses / 2) + (given - received);

            return (
              <div key={m.userId} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                      m.userId === userId
                        ? "bg-sky-100 text-sky-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {getInitials(m.user.name)}
                  </div>
                  <span className="text-sm text-gray-700">
                    {m.userId === userId ? "Vos" : m.user.name}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    gastos {formatCurrency(spent)} · prestó {formatCurrency(given)}
                  </p>
                  <p
                    className={`text-sm font-medium ${
                      balance > 0
                        ? "text-emerald-600"
                        : balance < 0
                          ? "text-red-500"
                          : "text-gray-500"
                    }`}
                  >
                    {balance > 0 ? "+" : ""}
                    {formatCurrency(balance)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sección gastos */}
        <div className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Gastos compartidos</p>
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
              {group.expenses.length}
            </span>
          </div>

          {group.expenses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
              <p className="text-sm text-muted-foreground">Sin gastos todavía.</p>
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

        {/* Sección préstamos */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Préstamos</p>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
              {group.loans.length}
            </span>
          </div>

          {group.loans.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
              <p className="text-sm text-muted-foreground">Sin préstamos todavía.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {group.loans.map((loan) => (
                <div
                  key={loan.id}
                  className="group flex items-center justify-between rounded-xl border border-violet-100 bg-violet-50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-medium text-violet-700">
                      {getInitials(loan.fromUser.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{loan.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(loan.date)} · {loan.fromUser.name} → {loan.toUser.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm font-semibold text-violet-700">
                      {formatCurrency(Number(loan.amount))}
                    </p>
                    <DeleteLoanButton
                      loanId={loan.id}
                      groupId={group.id}
                      isOwner={loan.fromUserId === userId}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6 pb-24">
          <DeleteGroupButton groupId={group.id} hasPendingDeletion={hasPendingDeletion} />
        </div>
      </div>

      <AddItemFAB groupId={group.id} otherMember={otherMember} />
    </div>
  );
}
