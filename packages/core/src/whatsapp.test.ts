import { describe, expect, it } from "vitest";
import {
  formatDigest,
  matchByName,
  normalizePhoneBR,
  parseFixedCommand,
  phoneCandidatesBR,
  validateLlmIntent,
} from "./whatsapp";

describe("normalizePhoneBR", () => {
  it("prefixa 55 em números brasileiros de 10-11 dígitos", () => {
    expect(normalizePhoneBR("(11) 99999-8888")).toBe("5511999998888");
    expect(normalizePhoneBR("11 3333-4444")).toBe("551133334444");
  });

  it("mantém números já com DDI", () => {
    expect(normalizePhoneBR("5511999998888")).toBe("5511999998888");
    expect(normalizePhoneBR("+55 11 99999-8888")).toBe("5511999998888");
  });

  it("aceita formato de chat do WAHA", () => {
    expect(normalizePhoneBR("5511999998888@c.us")).toBe("5511999998888");
  });

  it("rejeita entradas curtas ou longas demais", () => {
    expect(normalizePhoneBR("123")).toBeNull();
    expect(normalizePhoneBR("1234567890123456")).toBeNull();
  });
});

describe("phoneCandidatesBR", () => {
  it("número de 13 dígitos gera também a variante sem o nono dígito", () => {
    expect(phoneCandidatesBR("5548999073477")).toEqual(["5548999073477", "554899073477"]);
  });

  it("número de 12 dígitos (JID do WhatsApp) gera também a variante com o nono dígito", () => {
    expect(phoneCandidatesBR("554899073477@c.us")).toEqual(["554899073477", "5548999073477"]);
  });

  it("13 dígitos cujo terceiro dígito local não é 9 fica só com uma variante", () => {
    // assinante começando com 8: não há nono dígito a remover
    expect(phoneCandidatesBR("5511876543210")).toEqual(["5511876543210"]);
  });

  it("local sem nono dígito no padrão celular fica com uma variante só", () => {
    expect(phoneCandidatesBR("14155552671")).toEqual(["5514155552671"]);
  });

  it("entrada inválida gera lista vazia", () => {
    expect(phoneCandidatesBR("123")).toEqual([]);
  });
});

describe("parseFixedCommand", () => {
  it("reconhece comandos simples com variações", () => {
    expect(parseFixedCommand("saldo")).toEqual({ kind: "saldo" });
    expect(parseFixedCommand("  SALDO ")).toEqual({ kind: "saldo" });
    expect(parseFixedCommand("Fatura")).toEqual({ kind: "fatura" });
    expect(parseFixedCommand("contas")).toEqual({ kind: "contas" });
    expect(parseFixedCommand("a pagar")).toEqual({ kind: "contas" });
    expect(parseFixedCommand("ajuda")).toEqual({ kind: "ajuda" });
    expect(parseFixedCommand("oi")).toEqual({ kind: "ajuda" });
  });

  it("extrai o termo de 'paguei'", () => {
    expect(parseFixedCommand("paguei aluguel")).toEqual({ kind: "paguei", term: "aluguel" });
    expect(parseFixedCommand("Paguei a conta de luz")).toEqual({
      kind: "paguei",
      term: "conta de luz",
    });
  });

  it("devolve null para linguagem natural (vai ao LLM)", () => {
    expect(parseFixedCommand("mercado 250 nubank")).toBeNull();
    expect(parseFixedCommand("recebi 500 de freela")).toBeNull();
  });
});

describe("validateLlmIntent", () => {
  it("aceita transação válida", () => {
    expect(
      validateLlmIntent({
        intent: "transaction",
        type: "expense",
        amount: 250.5,
        description: "Mercado",
        source: "nubank",
        category: "Mercado",
        installments: 1,
      }),
    ).toMatchObject({ intent: "transaction", amount: 250.5 });
  });

  it("rejeita unknown, valor inválido e descrição vazia", () => {
    expect(validateLlmIntent({ intent: "unknown" })).toBeNull();
    expect(
      validateLlmIntent({ intent: "transaction", amount: 0, description: "x" }),
    ).toBeNull();
    expect(
      validateLlmIntent({ intent: "transaction", amount: 10, description: "" }),
    ).toBeNull();
  });

  it("parcelamento exige 2+ parcelas", () => {
    expect(
      validateLlmIntent({
        intent: "installment",
        amount: 1200,
        description: "Notebook",
        installments: 1,
      }),
    ).toBeNull();
    expect(
      validateLlmIntent({
        intent: "installment",
        amount: 1200,
        description: "Notebook",
        installments: 3,
      }),
    ).toMatchObject({ installments: 3 });
  });
});

describe("matchByName", () => {
  const items = [{ name: "Nubank" }, { name: "Carteira" }, { name: "Itaú Click" }];

  it("acha por igualdade e por 'contém' nos dois sentidos", () => {
    expect(matchByName(items, "nubank")?.name).toBe("Nubank");
    expect(matchByName(items, "itau click")?.name).toBeUndefined(); // acento difere
    expect(matchByName(items, "cartão nubank")?.name).toBe("Nubank");
  });

  it("sem dica: só resolve quando há um único item", () => {
    expect(matchByName(items, "")).toBeNull();
    expect(matchByName([{ name: "Única" }], "")?.name).toBe("Única");
  });

  it("dica ambígua ou desconhecida em lista múltipla → null", () => {
    expect(matchByName(items, "banco")).toBeNull();
  });
});

describe("formatDigest", () => {
  it("null quando não há nada", () => {
    expect(formatDigest({ overdue: [], dueToday: [], dueTomorrow: [], invoices: [] })).toBeNull();
  });

  it("monta seções presentes", () => {
    const msg = formatDigest({
      overdue: [{ description: "Aluguel", amountCents: 180000, dueDate: "2026-07-05" }],
      dueToday: [{ description: "Luz", amountCents: 25000 }],
      dueTomorrow: [],
      invoices: [{ cardName: "Nubank", totalCents: 40000, dueDate: "2026-07-22" }],
    });
    expect(msg).toContain("Atrasadas");
    expect(msg).toContain("Aluguel");
    expect(msg).toContain("venceu 05/07/2026");
    expect(msg).toContain("Vencem hoje");
    expect(msg).not.toContain("Vencem amanhã");
    expect(msg).toContain("Faturas próximas");
  });
});
