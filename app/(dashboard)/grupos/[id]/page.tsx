import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { DeleteExpenseButton } from "@/components/groups/DeleteExpenseButton";
import { DeleteLoanButton } from "@/components/groups/DeleteLoanButton";
import { DeleteGroupButton } from "@/components/groups/DeleteGroupButton";
import { AddItemFAB } from "@/components/groups/AddItemFAB";
import { EditGroupName } from "@/components/groups/EditGroupName";
import { InviteMembersModal } from "@/components/groups/InviteMembersModal";
import { PayButton } from "@/components/groups/PayButton";
import { SettlementHistory } from "@/components/groups/SettlementHistory";
import { computeMyBalances, computeNetTotals } from "@/lib/balance";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(new Date(date));
}

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const activeTab = tab === "historico" ? "historico" : "activo";

  const session = await auth();
  const userId = session!.user!.id!;

  const [group, allUsers] = await Promise.all([
    db.group.findUnique({
      where: { id },
      include: {
        members: { include: { user: { select: { id: true, name: true, mpAlias: true } } } },
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
        settlements: {
          include: {
            paidBy: { select: { id: true, name: true } },
            receivedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        invitations: {
          where: { status: "PENDING" },
          include: { notifications: { select: { userId: true } } },
        },
      },
    }),
    db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!group) notFound();

  const isMember = group.members.some((m) => m.userId === userId);
  if (!isMember) notFound();

  const isCreator = group.createdById === userId;
  const memberIds = group.members.map((m) => m.userId);
  const nameById = new Map(group.members.map((m) => [m.userId, m.user.name]));
  const aliasById = new Map(group.members.map((m) => [m.userId, m.user.mpAlias]));

  const expenseInputs = group.expenses.map((e) => ({ userId: e.userId, price: Number(e.price) }));
  const loanInputs = group.loans.map((l) => ({
    fromUserId: l.fromUserId,
    toUserId: l.toUserId,
    amount: Number(l.amount),
  }));
  const settlementInputs = group.settlements.map((s) => ({
    paidById: s.paidById,
    receivedById: s.receivedById,
    amount: Number(s.amount),
  }));

  const myBalances = computeMyBalances(userId, memberIds, expenseInputs, loanInputs, settlementInputs);
  const netTotals = computeNetTotals(memberIds, expenseInputs, loanInputs, settlementInputs);

  const totalExpenses = expenseInputs.reduce((s, e) => s + e.price, 0);
  const totalLoans = loanInputs.reduce((s, l) => s + l.amount, 0);
  const myNet = netTotals[userId] ?? 0;

  const activeBalances = myBalances.filter((b) => Math.abs(b.amount) >= 0.01);

  const pendingUserIds = group.invitations.flatMap((inv) =>
    inv.notifications.map((n) => n.userId)
  );
  const pendingNames = pendingUserIds
    .map((pid) => allUsers.find((u) => u.id === pid)?.name)
    .filter((n): n is string => !!n);

  const availableUsers = allUsers.filter(
    (u) => !memberIds.includes(u.id) && !pendingUserIds.includes(u.id)
  );

  const otherMembers = group.members
    .filter((m) => m.userId !== userId)
    .map((m) => ({ id: m.userId, name: m.user.name }));

  const paymentRecords = group.settlements.map((s) => ({
    id: s.id,
    amount: Number(s.amount),
    createdAt: s.createdAt.toISOString(),
    paidBy: s.paidBy,
    receivedBy: s.receivedBy,
  }));

  const myNetColor =
    myNet > 0.01
      ? "bg-emerald-50 border-emerald-100 text-emerald-700"
      : myNet < -0.01
        ? "bg-red-50 border-red-100 text-red-600"
        : "bg-gray-50 border-gray-100 text-gray-600";
  const myNetLabel =
    myNet > 0.01
      ? `Te deben ${formatCurrency(myNet)}`
      : myNet < -0.01
        ? `Debés ${formatCurrency(Math.abs(myNet))}`
        : "Al día";

  return (
    <div className="relative">
      <div className="mx-auto w-full max-w-2xl px-6 py-8 pb-24">
        <div className="mb-2 flex items-center justify-between gap-3">
          <EditGroupName groupId={group.id} currentName={group.name} canEdit={isCreator} />
          {isCreator && (
            <InviteMembersModal groupId={group.id} availableUsers={availableUsers} />
          )}
        </div>

        {/* Miembros */}
        <div className="mb-6 flex flex-wrap items-center gap-1.5">
          {group.members.map((m) => (
            <span
              key={m.userId}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-0.5 pl-1 pr-2.5 text-xs text-gray-700"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-200 text-[9px] font-medium text-sky-800">
                {getInitials(m.user.name)}
              </span>
              {m.userId === userId ? "Vos" : m.user.name}
            </span>
          ))}
          {pendingNames.map((name, i) => (
            <span
              key={`pending-${i}`}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 py-0.5 px-2.5 text-xs text-muted-foreground"
            >
              {name} · pendiente
            </span>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex border-b border-gray-200">
          <a
            href={`/grupos/${id}`}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "activo"
                ? "border-b-2 border-sky-600 text-sky-600"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Activo
          </a>
          <a
            href={`/grupos/${id}?tab=historico`}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "historico"
                ? "border-b-2 border-sky-600 text-sky-600"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pagos
            {paymentRecords.length > 0 && (
              <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                {paymentRecords.length}
              </span>
            )}
          </a>
        </div>

        {activeTab === "historico" ? (
          <SettlementHistory groupId={group.id} payments={paymentRecords} currentUserId={userId} />
        ) : (
          <>
            {/* Cards de resumen */}
            <div className="mb-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs text-muted-foreground">Gastos</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs text-muted-foreground">Préstamos</p>
                <p className="mt-1 text-xl font-semibold text-violet-600">{formatCurrency(totalLoans)}</p>
              </div>
              <div className={`rounded-xl border p-4 ${myNetColor}`}>
                <p className="text-xs opacity-70">Tu balance</p>
                <p className="mt-1 text-sm font-medium leading-tight">{myNetLabel}</p>
              </div>
            </div>

            {/* Tus saldos por persona */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
              <p className="mb-3 text-xs font-medium text-muted-foreground">Tus saldos</p>
              {activeBalances.length === 0 ? (
                <p className="text-sm text-muted-foreground">Estás al día con todos. 🎉</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {activeBalances.map((b) => {
                    const name = nameById.get(b.userId) ?? "Alguien";
                    const theyOweMe = b.amount > 0;
                    return (
                      <div key={b.userId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                            {getInitials(name)}
                          </div>
                          <span className="text-sm text-gray-700">
                            {theyOweMe ? (
                              <>
                                <span className="font-medium">{name}</span> te debe
                              </>
                            ) : (
                              <>
                                Le debés a <span className="font-medium">{name}</span>
                              </>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`text-sm font-semibold ${
                              theyOweMe ? "text-emerald-600" : "text-red-500"
                            }`}
                          >
                            {formatCurrency(Math.abs(b.amount))}
                          </span>
                          {!theyOweMe && (
                            <PayButton
                              groupId={group.id}
                              toUserId={b.userId}
                              toName={name}
                              toAlias={aliasById.get(b.userId) ?? null}
                              amount={Math.abs(b.amount)}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desglose por persona */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
              <p className="mb-3 text-xs font-medium text-muted-foreground">Desglose</p>
              {group.members.map((m) => {
                const spent = group.expenses
                  .filter((e) => e.userId === m.userId)
                  .reduce((s, e) => s + Number(e.price), 0);
                const given = group.loans
                  .filter((l) => l.fromUserId === m.userId)
                  .reduce((s, l) => s + Number(l.amount), 0);
                const net = netTotals[m.userId] ?? 0;
                return (
                  <div key={m.userId} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${m.userId === userId ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {getInitials(m.user.name)}
                      </div>
                      <span className="text-sm text-gray-700">{m.userId === userId ? "Vos" : m.user.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        gastó {formatCurrency(spent)} · prestó {formatCurrency(given)}
                      </p>
                      <p className={`text-sm font-medium ${net > 0.01 ? "text-emerald-600" : net < -0.01 ? "text-red-500" : "text-gray-500"}`}>
                        {net > 0.01 ? "+" : ""}{formatCurrency(net)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gastos */}
            <div className="mb-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Gastos compartidos</p>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">{group.expenses.length}</span>
              </div>
              {group.expenses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
                  <p className="text-sm text-muted-foreground">Sin gastos todavía.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {group.expenses.map((expense) => (
                    <div key={expense.id} className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${expense.userId === userId ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {getInitials(expense.user.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{expense.name}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(expense.date)} · {expense.user.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(Number(expense.price))}</p>
                        <DeleteExpenseButton expenseId={expense.id} groupId={group.id} isOwner={expense.userId === userId} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Préstamos */}
            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Préstamos</p>
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">{group.loans.length}</span>
              </div>
              {group.loans.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
                  <p className="text-sm text-muted-foreground">Sin préstamos todavía.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {group.loans.map((loan) => (
                    <div key={loan.id} className="group flex items-center justify-between rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-medium text-violet-700">
                          {getInitials(loan.fromUser.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{loan.name}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(loan.date)} · {loan.fromUser.name} → {loan.toUser.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm font-semibold text-violet-700">{formatCurrency(Number(loan.amount))}</p>
                        <DeleteLoanButton loanId={loan.id} groupId={group.id} isOwner={loan.fromUserId === userId} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <DeleteGroupButton groupId={group.id} canDelete={isCreator} />
            </div>
          </>
        )}
      </div>

      <AddItemFAB groupId={group.id} members={otherMembers} />
    </div>
  );
}
