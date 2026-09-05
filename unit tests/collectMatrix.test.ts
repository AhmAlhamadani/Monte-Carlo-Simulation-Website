import { describe, expect, it } from "vitest";
import { collectMatrix, lowerTriangleCells } from "../src/app/matrix/grid";

const names = ["Memory", "Attention", "Language"];
const order = lowerTriangleCells(3);

function grid(cells: string[][]) {
  return cells;
}

describe("collectMatrix", () => {
  it("accepts a complete matrix and mirrors the lower triangle", () => {
    const result = collectMatrix(
      3,
      names,
      grid([
        ["", "", ""],
        ["0.5", "", ""],
        ["0.2", "0.3", ""],
      ]),
      order,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.testNames).toEqual(names);
    expect(result.data.correlations[0][0]).toBe(1);
    expect(result.data.correlations[1][0]).toBe(0.5);
    expect(result.data.correlations[0][1]).toBe(0.5);
    expect(result.data.correlations[2][1]).toBe(0.3);
    expect(result.data.correlations[1][2]).toBe(0.3);
  });

  it("rejects empty cells before run", () => {
    const result = collectMatrix(
      3,
      names,
      grid([
        ["", "", ""],
        ["0.5", "", ""],
        ["", "0.3", ""],
      ]),
      order,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("still need a value");
  });

  it("rejects values outside −1.0 to 1.0", () => {
    const result = collectMatrix(
      3,
      names,
      grid([
        ["", "", ""],
        ["1.2", "", ""],
        ["0.2", "0.3", ""],
      ]),
      order,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("−1.0 to 1.0");
  });
});
