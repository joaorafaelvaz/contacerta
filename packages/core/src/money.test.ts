import { describe, expect, it } from "vitest";
import { formatBRL, parseAmountToCents } from "./money";

describe("parseAmountToCents", () => {
  it("aceita formato brasileiro completo", () => {
    expect(parseAmountToCents("1.234,56")).toBe(123456);
    expect(parseAmountToCents("R$ 1.234,56")).toBe(123456);
  });

  it("aceita vírgula decimal simples", () => {
    expect(parseAmountToCents("1234,56")).toBe(123456);
    expect(parseAmountToCents("0,99")).toBe(99);
  });

  it("aceita ponto decimal (formato en)", () => {
    expect(parseAmountToCents("1234.56")).toBe(123456);
    expect(parseAmountToCents("12.34")).toBe(1234);
  });

  it("trata ponto seguido de 3 dígitos como milhar", () => {
    expect(parseAmountToCents("1.234")).toBe(123400);
  });

  it("aceita inteiros", () => {
    expect(parseAmountToCents("250")).toBe(25000);
  });

  it("rejeita lixo e valores não positivos", () => {
    expect(() => parseAmountToCents("abc")).toThrow();
    expect(() => parseAmountToCents("")).toThrow();
    expect(() => parseAmountToCents("-10")).toThrow();
    expect(() => parseAmountToCents("0")).toThrow();
  });
});

describe("formatBRL", () => {
  it("formata centavos em pt-BR", () => {
    //   = espaço não separável usado pelo Intl
    expect(formatBRL(123456).replace(/ /g, " ")).toBe("R$ 1.234,56");
    expect(formatBRL(99).replace(/ /g, " ")).toBe("R$ 0,99");
  });
});
