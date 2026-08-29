import initSqlJs, { type Database as SqlDatabase } from "sql.js";
import sqlWasm from "sql.js/dist/sql-wasm.wasm?url";
import type { SavedRun } from "../types";
import type { SimulationResult } from "./monte-carlo";

const IDB_NAME = "percentabnormk";
const IDB_STORE = "sqlite";
const IDB_KEY = "db";
const LEGACY_STORAGE_KEY = "percentabnormk.runs";

let db: SqlDatabase | null = null;
let initPromise: Promise<void> | null = null;

async function loadFromIndexedDB(): Promise<Uint8Array | null> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => {
      const tx = req.result.transaction(IDB_STORE, "readonly");
      const get = tx.objectStore(IDB_STORE).get(IDB_KEY);
      get.onsuccess = () => resolve((get.result as Uint8Array | undefined) ?? null);
      get.onerror = () => reject(get.error);
    };
    req.onerror = () => reject(req.error);
  });
}

async function saveToIndexedDB(data: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => {
      const tx = req.result.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(data, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
}

function persistDb() {
  if (!db) return;
  void saveToIndexedDB(db.export());
}

function createSchema() {
  db!.run(`
    CREATE TABLE IF NOT EXISTS saved_runs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      percentile INTEGER NOT NULL,
      num_tests INTEGER NOT NULL,
      test_names TEXT NOT NULL,
      correlations TEXT NOT NULL,
      result TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
}

function rowToSavedRun(row: Record<string, unknown>): SavedRun {
  return {
    id: row.id as string,
    name: row.name as string,
    notes: row.notes as string,
    percentile: row.percentile as number,
    numTests: row.num_tests as number,
    testNames: JSON.parse(row.test_names as string) as string[],
    correlations: JSON.parse(row.correlations as string) as (number | null)[][],
    result: JSON.parse(row.result as string) as SimulationResult | null,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
  };
}

function upsertRunInternal(run: SavedRun) {
  db!.run(
    `INSERT INTO saved_runs (
      id, name, notes, percentile, num_tests, test_names, correlations, result, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      notes = excluded.notes,
      percentile = excluded.percentile,
      num_tests = excluded.num_tests,
      test_names = excluded.test_names,
      correlations = excluded.correlations,
      result = excluded.result,
      updated_at = excluded.updated_at`,
    [
      run.id,
      run.name,
      run.notes,
      run.percentile,
      run.numTests,
      JSON.stringify(run.testNames),
      JSON.stringify(run.correlations),
      JSON.stringify(run.result),
      run.createdAt,
      run.updatedAt ?? run.createdAt,
    ],
  );
}

function migrateFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw || !db) return;
    const runs = JSON.parse(raw) as SavedRun[];
    const now = Date.now();
    for (const run of runs) {
      upsertRunInternal({
        ...run,
        updatedAt: run.updatedAt ?? run.createdAt ?? now,
      });
    }
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    persistDb();
  } catch {
  }
}

export async function initDb(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const SQL = await initSqlJs({ locateFile: () => sqlWasm });
    const existing = await loadFromIndexedDB();
    db = existing ? new SQL.Database(existing) : new SQL.Database();
    createSchema();
    migrateFromLocalStorage();
  })();
  return initPromise;
}

export function listRuns(): SavedRun[] {
  if (!db) return [];
  const results = db.exec("SELECT * FROM saved_runs ORDER BY updated_at DESC");
  if (!results.length) return [];

  const { columns, values } = results[0];
  return values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return rowToSavedRun(obj);
  });
}

export function getRun(id: string): SavedRun | null {
  if (!db) return null;
  const stmt = db.prepare("SELECT * FROM saved_runs WHERE id = ?");
  stmt.bind([id]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject() as Record<string, unknown>;
  stmt.free();
  return rowToSavedRun(row);
}

export function upsertRun(run: SavedRun): SavedRun {
  if (!db) throw new Error("Database not initialized");
  const existing = getRun(run.id);
  const now = Date.now();
  const toSave: SavedRun = {
    ...run,
    createdAt: existing?.createdAt ?? run.createdAt ?? now,
    updatedAt: now,
  };
  upsertRunInternal(toSave);
  persistDb();
  return toSave;
}

export function deleteRun(id: string): void {
  if (!db) return;
  db.run("DELETE FROM saved_runs WHERE id = ?", [id]);
  persistDb();
}
