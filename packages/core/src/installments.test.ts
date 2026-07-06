import { describe, expect, it } from "vitest";
import { installmentPlan, splitInstallments } from "./installments";
import { invoiceCycleForDate } from "./invoice";

describe("splitInstallments", () => {
  it("divide igualmente quando não há resto", () => {
    expect(splitInstallments(30000, 3)).toEqual([10000, 10000, 10000]);
  });

  it("coloca o resto na primeira parcela", () => {
    expect(splitInstallments(10000, 3)).toEqual([3334, 3333, 3333]);
    expect(splitInstallments(100, 3)).toEqual([34, 33, 33]);
  });

  it("soma das parcelas é sempre o total", () => {
    for (const total of [1, 99, 100, 12345, 999999]) {
      for (const n of [1, 2, 3, 7, 12, 24]) {
        const parts = splitInstallments(total, n);
        expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
        expect(parts).toHaveLength(n);
      }
    }
  });

  it("rejeita valores inválidos", () => {
    expect(() => splitInstallments(0, 3)).toThrow();
    expect(() => splitInstallments(100.5, 3)).toThrow();
    expect(() => splitInstallments(100, 0)).toThrow();
  });
});

describe("installmentPlan", () => {
  it("primeira parcela na fatura da compra, demais em ciclos consecutivos", () => {
    const plan = installmentPlan({
      totalCents: 30000,
      installments: 3,
      purchaseDate: "2026-01-10", // fechamento 15 → fatura 2026-01
      closingDay: 15,
    });
    expect(plan.map((p) => p.cycle)).toEqual(["2026-01", "2026-02", "2026-03"]);
    expect(plan[0]!.date).toBe("2026-01-10");
    expect(plan.map((p) => p.amountCents)).toEqual([10000, 10000, 10000]);
  });

  it("compra após o fechamento começa na fatura seguinte", () => {
    const plan = installmentPlan({
      totalCents: 20000,
      installments: 2,
      purchaseDate: "2026-01-20",
      closingDay: 15,
    });
    expect(plan.map((p) => p.cycle)).toEqual(["2026-02", "2026-03"]);
  });

  it("cada parcela cai de fato no ciclo planejado (propriedade)", () => {
    for (const closingDay of [1, 2, 15, 30, 31]) {
      for (const purchaseDate of ["2026-01-31", "2026-01-01", "2026-02-28", "2026-12-31"]) {
        const plan = installmentPlan({
          totalCents: 123456,
          installments: 12,
          purchaseDate,
          closingDay,
        });
        for (const item of plan) {
          expect(
            invoiceCycleForDate(closingDay, item.date),
            `close=${closingDay} compra=${purchaseDate} parcela=${item.number} data=${item.date}`,
          ).toBe(item.cycle);
        }
        // ciclos consecutivos, sem pular fatura
        const first = plan[0]!.cycle;
        plan.forEach((item, i) => {
          const [y, m] = first.split("-").map(Number);
          const total = y! * 12 + (m! - 1) + i;
          const expected = `${String(Math.floor(total / 12)).padStart(4, "0")}-${String((total % 12) + 1).padStart(2, "0")}`;
          expect(item.cycle).toBe(expected);
        });
      }
    }
  });

  it("compra dia 31 com fechamento 31: parcelas viram fevereiro sem quebrar", () => {
    const plan = installmentPlan({
      totalCents: 40000,
      installments: 4,
      purchaseDate: "2026-01-31",
      closingDay: 31,
    });
    expect(plan.map((p) => p.cycle)).toEqual(["2026-01", "2026-02", "2026-03", "2026-04"]);
    expect(plan[1]!.date).toBe("2026-02-28");
    expect(plan[2]!.date).toBe("2026-03-31");
  });
});
