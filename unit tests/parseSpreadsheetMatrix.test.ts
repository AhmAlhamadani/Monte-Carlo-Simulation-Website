import { describe, expect, it } from "vitest";
import { parseSpreadsheetMatrix } from "../src/app/matrix/spreadsheet";

describe("parseSpreadsheetMatrix", () => {
  it("fills the lower triangle from an Excel TSV paste", () => {
    const pasted = [
      "1\t0.5\t0.2",
      "0.5\t1\t0.3",
      "0.2\t0.3\t1",
    ].join("\n");

    const result = parseSpreadsheetMatrix(pasted);
    expect("error" in result).toBe(false);
    if ("error" in result) return;

    expect(result.size).toBe(3);
    expect(result.matrix[1][0]).toBe(0.5);
    expect(result.matrix[2][0]).toBe(0.2);
    expect(result.matrix[2][1]).toBe(0.3);
    expect(result.matrix[0][0]).toBe(1);
  });

  it("reads test names from a header row and column", () => {
    const pasted = [
      "\tMemory\tAttention",
      "Memory\t1\t0.4",
      "Attention\t0.4\t1",
    ].join("\n");

    const result = parseSpreadsheetMatrix(pasted);
    expect("error" in result).toBe(false);
    if ("error" in result) return;

    expect(result.size).toBe(2);
    expect(result.names).toEqual(["Memory", "Attention"]);
    expect(result.matrix[1][0]).toBe(0.4);
  });

  it("rejects values outside −1.0 to 1.0", () => {
    const pasted = ["1\t1.5", "1.5\t1"].join("\n");
    const result = parseSpreadsheetMatrix(pasted);
    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error).toContain("−1.0 to 1.0");
  });

  it("rejects a paste that is too small", () => {
    const result = parseSpreadsheetMatrix("1");
    expect("error" in result).toBe(true);
  });
});
