import { describe, expect, it } from "vitest";
import {
  closingDateFor,
  cycleRange,
  dateInCycleWithDay,
  invoiceCycleForDate,
  invoiceDueDate,
} from "./invoice";

describe("closingDateFor", () => {
  it("usa o dia de fechamento quando o mês comporta", () => {
    expect(closingDateFor(15, "2026-03")).toBe("2026-03-15");
  });

  it("clampa fechamento 31 em meses curtos", () => {
    expect(closingDateFor(31, "2026-04")).toBe("2026-04-30");
    expect(closingDateFor(31, "2026-02")).toBe("2026-02-28");
  });

  it("clampa fechamento 30 em fevereiro bissexto", () => {
    expect(closingDateFor(30, "2028-02")).toBe("2028-02-29");
  });
});

describe("invoiceCycleForDate", () => {
  it("compra antes do fechamento cai na fatura do mês", () => {
    expect(invoiceCycleForDate(15, "2026-03-10")).toBe("2026-03");
  });

  it("compra no dia do fechamento pertence à fatura que fecha", () => {
    expect(invoiceCycleForDate(15, "2026-03-15")).toBe("2026-03");
  });

  it("compra após o fechamento cai na fatura seguinte", () => {
    expect(invoiceCycleForDate(15, "2026-03-16")).toBe("2026-04");
  });

  it("vira o ano corretamente", () => {
    expect(invoiceCycleForDate(15, "2026-12-20")).toBe("2027-01");
  });

  it("fechamento 31: todo lançamento do mês cai na fatura do próprio mês", () => {
    expect(invoiceCycleForDate(31, "2026-04-30")).toBe("2026-04");
    expect(invoiceCycleForDate(31, "2026-02-28")).toBe("2026-02");
    expect(invoiceCycleForDate(31, "2026-03-01")).toBe("2026-03");
  });
});

describe("cycleRange", () => {
  it("ciclo cobre do dia seguinte ao fechamento anterior até o fechamento", () => {
    expect(cycleRange(15, "2026-03")).toEqual({ start: "2026-02-16", end: "2026-03-15" });
  });

  it("fechamento 31 gera ciclos mês-calendário (com clamps)", () => {
    expect(cycleRange(31, "2026-03")).toEqual({ start: "2026-03-01", end: "2026-03-31" });
    // fevereiro: fecha dia 28, ciclo começa 1º de fev (fechamento jan = 31/01)
    expect(cycleRange(31, "2026-02")).toEqual({ start: "2026-02-01", end: "2026-02-28" });
    // março após fevereiro curto: começa 01/03
    expect(cycleRange(31, "2026-03").start).toBe("2026-03-01");
  });

  it("fechamento 30 após fevereiro: ciclo de março começa em 01/03", () => {
    expect(cycleRange(30, "2026-03")).toEqual({ start: "2026-03-01", end: "2026-03-30" });
  });

  it("ciclos consecutivos não deixam buraco nem sobreposição", () => {
    for (const closingDay of [1, 2, 15, 28, 29, 30, 31]) {
      let prevEnd: string | null = null;
      for (const cycle of ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05"]) {
        const { start, end } = cycleRange(closingDay, cycle);
        expect(start <= end).toBe(true);
        if (prevEnd) {
          // início do ciclo = dia seguinte ao fim do anterior
          expect(start > prevEnd).toBe(true);
        }
        prevEnd = end;
      }
    }
  });
});

describe("invoiceDueDate", () => {
  it("vencimento no mesmo mês quando dueDay > fechamento", () => {
    expect(invoiceDueDate(15, 25, "2026-03")).toBe("2026-03-25");
  });

  it("vencimento no mês seguinte quando dueDay <= fechamento", () => {
    expect(invoiceDueDate(25, 5, "2026-03")).toBe("2026-04-05");
  });

  it("vencimento igual ao fechamento vai para o mês seguinte", () => {
    expect(invoiceDueDate(10, 10, "2026-03")).toBe("2026-04-10");
  });

  it("clampa vencimento 31 em mês curto", () => {
    expect(invoiceDueDate(15, 31, "2026-04")).toBe("2026-04-30");
  });
});

describe("dateInCycleWithDay", () => {
  it("mantém o dia preferido quando cai dentro do ciclo (mês da competência)", () => {
    // ciclo 2026-03 com fechamento 15: 16/02 a 15/03
    expect(dateInCycleWithDay(15, "2026-03", 10)).toBe("2026-03-10");
  });

  it("usa o mês anterior quando o dia preferido só cabe lá", () => {
    expect(dateInCycleWithDay(15, "2026-03", 20)).toBe("2026-02-20");
  });

  it("resultado sempre pertence ao ciclo pedido", () => {
    for (const closingDay of [1, 2, 15, 28, 29, 30, 31]) {
      for (const day of [1, 2, 14, 15, 16, 28, 29, 30, 31]) {
        for (const cycle of ["2026-01", "2026-02", "2026-03", "2026-12"]) {
          const date = dateInCycleWithDay(closingDay, cycle, day);
          expect(invoiceCycleForDate(closingDay, date), `close=${closingDay} day=${day} cycle=${cycle}`).toBe(cycle);
        }
      }
    }
  });
});
