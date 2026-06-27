// Cálculo de deudas por pares, neteado.
//
// Reglas:
// - Cada gasto lo paga 1 persona y se divide en partes iguales entre TODOS
//   los miembros confirmados. Cada miembro distinto del pagador le debe su parte.
// - Cada préstamo F→T: T le debe el monto completo a F.
// - Para cada par (X, Y) se netea: si X le debe a Y y Y le debe a X, se cancela.

export interface ExpenseInput {
  userId: string;
  price: number;
}

export interface LoanInput {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export interface BalanceEntry {
  userId: string;
  // > 0: esa persona TE debe · < 0: vos le debés a esa persona
  amount: number;
}

// Construye la matriz debt[deudor][acreedor].
function buildDebtMatrix(
  memberIds: string[],
  expenses: ExpenseInput[],
  loans: LoanInput[]
): Record<string, Record<string, number>> {
  const debt: Record<string, Record<string, number>> = {};

  const add = (debtor: string, creditor: string, amount: number) => {
    if (debtor === creditor || amount === 0) return;
    debt[debtor] ??= {};
    debt[debtor][creditor] = (debt[debtor][creditor] ?? 0) + amount;
  };

  const n = memberIds.length;
  if (n > 0) {
    for (const e of expenses) {
      const share = e.price / n;
      for (const mid of memberIds) {
        if (mid !== e.userId) add(mid, e.userId, share);
      }
    }
  }

  for (const l of loans) {
    add(l.toUserId, l.fromUserId, l.amount);
  }

  return debt;
}

// Devuelve, desde la perspectiva de `myId`, el neto con cada otro miembro.
export function computeMyBalances(
  myId: string,
  memberIds: string[],
  expenses: ExpenseInput[],
  loans: LoanInput[]
): BalanceEntry[] {
  const debt = buildDebtMatrix(memberIds, expenses, loans);

  return memberIds
    .filter((id) => id !== myId)
    .map((other) => {
      const iOwe = debt[myId]?.[other] ?? 0;
      const theyOwe = debt[other]?.[myId] ?? 0;
      return { userId: other, amount: round2(theyOwe - iOwe) };
    });
}

// Balance neto global de cada miembro (cuánto le deben en total menos cuánto debe).
// Es invariante al neteo: equivale a (lo que pagó/prestó) − (su parte de todo).
export function computeNetTotals(
  memberIds: string[],
  expenses: ExpenseInput[],
  loans: LoanInput[]
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const id of memberIds) totals[id] = 0;

  const n = memberIds.length;
  if (n > 0) {
    const totalExpenses = expenses.reduce((s, e) => s + e.price, 0);
    const sharePerMember = totalExpenses / n;
    for (const id of memberIds) {
      const paid = expenses
        .filter((e) => e.userId === id)
        .reduce((s, e) => s + e.price, 0);
      totals[id] += paid - sharePerMember;
    }
  }

  for (const l of loans) {
    if (totals[l.fromUserId] !== undefined) totals[l.fromUserId] += l.amount;
    if (totals[l.toUserId] !== undefined) totals[l.toUserId] -= l.amount;
  }

  for (const id of memberIds) totals[id] = round2(totals[id]);
  return totals;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
