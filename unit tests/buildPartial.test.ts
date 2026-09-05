import { describe, expect, it } from "vitest";
import { buildPartial, initialValueGrid } from "../src/app/matrix/grid";

describe("buildPartial and initialValueGrid", () => {
  it("keeps empty cells empty instead of turning them into 0", () => {
    const values = [
      ["", "", ""],
      ["0.4", "", ""],
      ["", "", ""],
    ];
    const saved = buildPartial(values, 3);

    expect(saved[0][0]).toBe(1);
    expect(saved[1][0]).toBe(0.4);
    expect(saved[0][1]).toBe(0.4);
    expect(saved[2][0]).toBeNull();
    expect(saved[2][1]).toBeNull();

    const restored = initialValueGrid(3, saved);
    expect(restored[1][0]).toBe("0.4");
    expect(restored[2][0]).toBe("");
    expect(restored[2][1]).toBe("");
  });

  it("round-trips a real zero so it does not look missing", () => {
    const values = [
      ["", ""],
      ["0", ""],
    ];
    const saved = buildPartial(values, 2);
    expect(saved[1][0]).toBe(0);

    const restored = initialValueGrid(2, saved);
    expect(restored[1][0]).toBe("0");
  });
});
