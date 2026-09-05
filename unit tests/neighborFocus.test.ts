import { describe, expect, it } from "vitest";
import { neighborFocus, nextEnterCell } from "../src/app/matrix/grid";

describe("neighborFocus", () => {
  it("moves from a test name right into that row's first correlation", () => {
    expect(neighborFocus({ kind: "name", r: 1 }, "right", 3)).toEqual({
      kind: "cell",
      r: 1,
      c: 0,
    });
  });

  it("moves from the first correlation left back to the test name", () => {
    expect(neighborFocus({ kind: "cell", r: 1, c: 0 }, "left", 3)).toEqual({
      kind: "name",
      r: 1,
    });
  });

  it("does not move up into the diagonal", () => {
    expect(neighborFocus({ kind: "cell", r: 2, c: 1 }, "up", 3)).toBeNull();
  });

  it("moves down in the same column when a cell exists", () => {
    expect(neighborFocus({ kind: "cell", r: 1, c: 0 }, "down", 3)).toEqual({
      kind: "cell",
      r: 2,
      c: 0,
    });
  });
});

describe("nextEnterCell", () => {
  it("walks the lower triangle in row order", () => {
    expect(nextEnterCell(1, 0, 3)).toEqual({ kind: "cell", r: 2, c: 0 });
    expect(nextEnterCell(2, 0, 3)).toEqual({ kind: "cell", r: 2, c: 1 });
    expect(nextEnterCell(2, 1, 3)).toBeNull();
  });
});
