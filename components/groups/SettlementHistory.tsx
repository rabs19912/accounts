"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SettlementItem {
  id: string;
  name: string;
  amount: number;
  type: "expense" | "loan";
  userName: string;
  createdAt: string;
}

interface Settlement {
  id: string;
  amount: number;
  createdAt: string;
  paidBy: { name: string };
  receivedBy: { name: string };
  expenses: SettlementItem[];
  loans: SettlementItem[];
}

interface Props {
  settlements: Settlement[];
  currentUserId: string;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

function formatMonth(dateStr: string) {
  return new Intl.DateTimeFormat("es-AR", { month: "short", year: "numeric" })
    .format(new Date(dateStr))
    .replace(".", "");
}

export function SettlementHistory({ settlements, currentUserId }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(
    settlements[0]?.id ?? null
  );
  const [monthFilter, setMonthFilter] = useState<string | null>(null);

  const months = Array.from(
    new Set(settlements.map((s) => formatMonth(s.createdAt)))
  );

  const filtered = monthFilter
    ? settlements.filter((s) => formatMonth(s.createdAt) === monthFilter)
    : settlements;

  if (settlements.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <p className="text-sm text-muted-foreground">
          Todavía no hay saldos registrados.
        </p>
      </div>
    );
  }

  return (
    <div>
      {months.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setMonthFilter(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !monthFilter
                ? "bg-sky-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            Todo
          </button>
          {months.map((m) => (
            <button
              key={m}
              onClick={() => setMonthFilter(m === monthFilter ? null : m)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                monthFilter === m
                  ? "bg-sky-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((s) => {
          const isExpanded = expandedId === s.id;
          const iMePaid = s.paidBy !== undefined;
          const allItems = [
            ...s.expenses.map((e) => ({ ...e, type: "expense" as const })),
            ...s.loans.map((l) => ({ ...l, type: "loan" as const })),
          ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          return (
            <div
              key={s.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              <button
                className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left hover:bg-gray-100"
                onClick={() => setExpandedId(isExpanded ? null : s.id)}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Saldo del {formatDate(s.createdAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.expenses.length} gasto{s.expenses.length !== 1 ? "s" : ""} ·{" "}
                    {s.loans.length} préstamo{s.loans.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(Number(s.amount))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.paidBy.name} → {s.receivedBy.name}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="divide-y divide-gray-50">
                  {allItems.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-muted-foreground">
                      Sin items en este período.
                    </p>
                  ) : (
                    allItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-4 py-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              item.type === "expense" ? "bg-sky-400" : "bg-violet-400"
                            }`}
                          />
                          <div>
                            <p className="text-sm text-gray-900">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(item.createdAt)} · {item.userName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              item.type === "expense"
                                ? "bg-sky-100 text-sky-700"
                                : "bg-violet-100 text-violet-700"
                            }`}
                          >
                            {item.type === "expense" ? "Gasto" : "Préstamo"}
                          </span>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(item.amount)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
