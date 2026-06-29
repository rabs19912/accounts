import { describe, it, expect } from "vitest";
import { computeMyBalances, computeNetTotals } from "./balance";

// helpers para legibilidad
const expense = (userId: string, price: number) => ({ userId, price });
const loan = (fromUserId: string, toUserId: string, amount: number) => ({
  fromUserId,
  toUserId,
  amount,
});
const payment = (paidById: string, receivedById: string, amount: number) => ({
  paidById,
  receivedById,
  amount,
});

// suma de un objeto de netos, redondeada (para el invariante de suma-cero)
const sumValues = (obj: Record<string, number>) =>
  Math.round(Object.values(obj).reduce((s, n) => s + n, 0) * 100) / 100;

describe("computeMyBalances — deudas por pares neteadas", () => {
  it("ejemplo del usuario: grupo de 4, A y B gastan 100 → A y B se netean a 0", () => {
    const members = ["A", "B", "C", "D"];
    const expenses = [expense("A", 100), expense("B", 100)];

    // Desde A: con B se netea (0), C y D le deben 25 cada uno
    expect(computeMyBalances("A", members, expenses, [])).toEqual([
      { userId: "B", amount: 0 },
      { userId: "C", amount: 25 },
      { userId: "D", amount: 25 },
    ]);

    // Desde C: le debe 25 a A y 25 a B, con D se netea
    expect(computeMyBalances("C", members, expenses, [])).toEqual([
      { userId: "A", amount: -25 },
      { userId: "B", amount: -25 },
      { userId: "D", amount: 0 },
    ]);
  });

  it("grupo de 2: A gasta 50 → B le debe 25 (compat con el viejo total/2)", () => {
    const members = ["A", "B"];
    const expenses = [expense("A", 50)];

    expect(computeMyBalances("A", members, expenses, [])).toEqual([
      { userId: "B", amount: 25 },
    ]);
    expect(computeMyBalances("B", members, expenses, [])).toEqual([
      { userId: "A", amount: -25 },
    ]);
  });

  it("préstamo simple: A le presta 100 a B → B le debe 100 completo", () => {
    const members = ["A", "B"];
    const loans = [loan("A", "B", 100)];

    expect(computeMyBalances("A", members, [], loans)).toEqual([
      { userId: "B", amount: 100 },
    ]);
    expect(computeMyBalances("B", members, [], loans)).toEqual([
      { userId: "A", amount: -100 },
    ]);
  });

  it("gasto + préstamo opuestos se netean entre el par", () => {
    const members = ["A", "B"];
    const expenses = [expense("A", 100)]; // B le debe 50 a A
    const loans = [loan("B", "A", 50)]; // A le debe 50 a B

    expect(computeMyBalances("A", members, expenses, loans)).toEqual([
      { userId: "B", amount: 0 },
    ]);
  });

  it("grupo de 3: A gasta 90 → B y C le deben 30; entre B y C no hay deuda", () => {
    const members = ["A", "B", "C"];
    const expenses = [expense("A", 90)];

    expect(computeMyBalances("A", members, expenses, [])).toEqual([
      { userId: "B", amount: 30 },
      { userId: "C", amount: 30 },
    ]);
    expect(computeMyBalances("B", members, expenses, [])).toEqual([
      { userId: "A", amount: -30 },
      { userId: "C", amount: 0 },
    ]);
  });

  it("un préstamo entre otros dos miembros no afecta mi balance", () => {
    const members = ["A", "B", "C"];
    const loans = [loan("B", "C", 50)];

    expect(computeMyBalances("A", members, [], loans)).toEqual([
      { userId: "B", amount: 0 },
      { userId: "C", amount: 0 },
    ]);
  });

  it("sin gastos ni préstamos: todos los saldos en 0", () => {
    const members = ["A", "B", "C"];
    expect(computeMyBalances("A", members, [], [])).toEqual([
      { userId: "B", amount: 0 },
      { userId: "C", amount: 0 },
    ]);
  });

  it("redondea a 2 decimales cuando el gasto no divide exacto", () => {
    const members = ["A", "B", "C"];
    const expenses = [expense("A", 100)]; // 100/3 = 33.333…

    expect(computeMyBalances("A", members, expenses, [])).toEqual([
      { userId: "B", amount: 33.33 },
      { userId: "C", amount: 33.33 },
    ]);
  });

  it("un pago salda la deuda de ese par sin tocar a los demás", () => {
    const members = ["A", "B", "C"];
    const expenses = [expense("A", 90)]; // B y C le deben 30 a A
    const payments = [payment("B", "A", 30)]; // B le paga 30 a A

    // Desde A: B saldado (0), C todavía le debe 30
    expect(computeMyBalances("A", members, expenses, [], payments)).toEqual([
      { userId: "B", amount: 0 },
      { userId: "C", amount: 30 },
    ]);
  });

  it("un pago parcial deja el saldo restante", () => {
    const members = ["A", "B"];
    const expenses = [expense("A", 100)]; // B le debe 50 a A
    const payments = [payment("B", "A", 20)]; // B paga 20

    expect(computeMyBalances("B", members, expenses, [], payments)).toEqual([
      { userId: "A", amount: -30 }, // todavía debe 30
    ]);
  });
});

describe("computeNetTotals — balance neto global por persona", () => {
  it("ejemplo de 4: A y B en +50, C y D en -50; suma cero", () => {
    const members = ["A", "B", "C", "D"];
    const expenses = [expense("A", 100), expense("B", 100)];
    const net = computeNetTotals(members, expenses, []);

    expect(net).toEqual({ A: 50, B: 50, C: -50, D: -50 });
    expect(sumValues(net)).toBe(0);
  });

  it("incluye préstamos: el que presta suma, el que recibe resta", () => {
    const members = ["A", "B"];
    const expenses = [expense("A", 100)]; // A +50, B -50
    const loans = [loan("A", "B", 30)]; // A +30, B -30
    const net = computeNetTotals(members, expenses, loans);

    expect(net).toEqual({ A: 80, B: -80 });
  });

  it("invariante: la suma de todos los netos siempre da 0 (montos divisibles)", () => {
    const members = ["A", "B", "C"];
    const expenses = [expense("A", 60), expense("B", 30)];
    const net = computeNetTotals(members, expenses, []);

    expect(net).toEqual({ A: 30, B: 0, C: -30 });
    expect(sumValues(net)).toBe(0);
  });

  it("grupo sin movimientos: todos en 0", () => {
    const members = ["A", "B", "C"];
    expect(computeNetTotals(members, [], [])).toEqual({ A: 0, B: 0, C: 0 });
  });

  it("un pago netea el balance neto global y mantiene suma cero", () => {
    const members = ["A", "B"];
    const expenses = [expense("A", 100)]; // A +50, B -50
    const payments = [payment("B", "A", 50)]; // B salda → ambos en 0
    const net = computeNetTotals(members, expenses, [], payments);

    expect(net).toEqual({ A: 0, B: 0 });
    expect(sumValues(net)).toBe(0);
  });
});
