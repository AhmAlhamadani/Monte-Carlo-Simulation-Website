export function validateNumTests(raw: string): { ok: true; numTests: number } | { ok: false; error: string } {
  const n = parseInt(raw, 10);
  if (!raw || isNaN(n)) {
    return { ok: false, error: "Please enter the number of tests in the battery." };
  }
  if (n < 2) {
    return { ok: false, error: "A battery needs at least 2 tests to analyse." };
  }
  if (n > 25) {
    return { ok: false, error: "This tool supports a maximum of 25 tests." };
  }
  return { ok: true, numTests: n };
}
