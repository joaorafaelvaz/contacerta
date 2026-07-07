import { describe, expect, it } from "vitest";
import { formatBRL, parseAmountToCents, parseSignedAmountToCents } from "./money";

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

describe("parseSignedAmountToCents", () => {
  it("aceita zero em qualquer formato (saldo inicial zerado)", () => {
    expect(parseSignedAmountToCents("0")).toBe(0);
    expect(parseSignedAmountToCents("0,00")).toBe(0);
    expect(parseSignedAmountToCents("0.00")).toBe(0);
    expect(parseSignedAmountToCents("R$ 0,00")).toBe(0);
  });

  it("vazio vira zero", () => {
    expect(parseSignedAmountToCents("")).toBe(0);
    expect(parseSignedAmountToCents("   ")).toBe(0);
  });

  it("aceita negativos (conta no vermelho)", () => {
    expect(parseSignedAmountToCents("-50")).toBe(-5000);
    expect(parseSignedAmountToCents("-1.234,56")).toBe(-123456);
  });

  it("mantém positivos", () => {
    expect(parseSignedAmountToCents("1.000,00")).toBe(100000);
    expect(parseSignedAmountToCents("250")).toBe(25000);
  });

  it("rejeita lixo", () => {
    expect(() => parseSignedAmountToCents("abc")).toThrow();
    expect(() => parseSignedAmountToCents("-xyz")).toThrow();
  });
});

describe("formatBRL", () => {
  it("formata centavos em pt-BR", () => {
    //   = espaço não separável usado pelo Intl
    expect(formatBRL(123456).replace(/ /g, " ")).toBe("R$ 1.234,56");
    expect(formatBRL(99).replace(/ /g, " ")).toBe("R$ 0,99");
  });
});
