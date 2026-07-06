import { describe, expect, it } from "vitest";
import { occurrenceDate } from "./recurrence";

describe("occurrenceDate", () => {
  it("gera a data no dia da regra", () => {
    expect(occurrenceDate(5, "2026-03")).toBe("2026-03-05");
  });

  it("clampa dia 31 em meses curtos", () => {
    expect(occurrenceDate(31, "2026-04")).toBe("2026-04-30");
    expect(occurrenceDate(30, "2026-02")).toBe("2026-02-28");
    expect(occurrenceDate(29, "2028-02")).toBe("2028-02-29");
  });
});
