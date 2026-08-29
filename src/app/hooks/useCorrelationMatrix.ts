import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildPartial,
  collectMatrix,
  defaultTestNames,
  emptyValueGrid,
  initialValueGrid,
  lowerTriangleCells,
  valuesFromMatrix,
  type MatrixData,
} from "../matrix/grid";
import {
  formatCorr,
  looksLikeSpreadsheet,
  parseSpreadsheetMatrix,
} from "../matrix/spreadsheet";

export function useCorrelationMatrix(
  numTests: number,
  initialNames: string[],
  initialCorrelations: (number | null)[][],
  onDirty?: () => void,
) {
  const [names, setNames] = useState(() => defaultTestNames(numTests, initialNames));
  const [values, setValues] = useState(() =>
    initialValueGrid(numTests, initialCorrelations),
  );
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const cellOrder = useMemo(() => lowerTriangleCells(numTests), [numTests]);

  const setCell = (r: number, c: number, v: string) => {
    onDirty?.();
    setValues((prev) => {
      const next = prev.map((row) => row.slice());
      next[r][c] = v;
      return next;
    });
  };

  const setName = (index: number, name: string) => {
    onDirty?.();
    setNames((prev) => {
      const next = prev.slice();
      next[index] = name;
      return next;
    });
  };

  const applySpreadsheet = useCallback(
    (text: string) => {
      if (!looksLikeSpreadsheet(text)) {
        setInfo("");
        setError(
          "That paste does not look like a spreadsheet. Copy the cells from Excel or Google Sheets, then paste again.",
        );
        return false;
      }

      const parsed = parseSpreadsheetMatrix(text);
      if ("error" in parsed) {
        setInfo("");
        setError(parsed.error);
        return false;
      }

      if (parsed.size !== numTests) {
        setInfo("");
        setError(
          `The pasted spreadsheet is ${parsed.size}×${parsed.size}, but this analysis is set to ${numTests} tests. Go back and change the number of tests, or paste a ${numTests}×${numTests} matrix.`,
        );
        return false;
      }

      setValues(valuesFromMatrix(numTests, parsed.matrix, formatCorr));
      if (parsed.names && parsed.names.length === numTests) {
        setNames(parsed.names.map((n, i) => n || `Test ${i + 1}`));
      }
      setError("");
      setInfo("Matrix filled from spreadsheet.");
      onDirty?.();
      return true;
    },
    [numTests, onDirty],
  );

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const text = e.clipboardData?.getData("text/plain") ?? "";
      if (!looksLikeSpreadsheet(text)) return;
      e.preventDefault();
      applySpreadsheet(text);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [applySpreadsheet]);

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      applySpreadsheet(text);
    } catch {
      setInfo("");
      setError(
        "Could not read the clipboard. Copy the cells in your spreadsheet, click this page, then press Ctrl+V (Cmd+V on Mac).",
      );
    }
  };

  const clearAll = () => {
    onDirty?.();
    setValues(emptyValueGrid(numTests));
    setError("");
    setInfo("");
  };

  const collect = (): MatrixData | null => {
    const result = collectMatrix(numTests, names, values, cellOrder);
    if (!result.ok) {
      setInfo("");
      setError(result.error);
      return null;
    }
    setError("");
    return result.data;
  };

  const snapshot = (): MatrixData => ({
    testNames: names,
    correlations: buildPartial(values, numTests),
  });

  return {
    names,
    values,
    error,
    info,
    inputRefs,
    cellOrder,
    setCell,
    setName,
    pasteFromClipboard,
    clearAll,
    collect,
    snapshot,
  };
}
