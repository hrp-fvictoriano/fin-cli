import { Database } from "bun:sqlite";
import { join } from "path";
import { homedir } from "os";
import { existsSync, mkdirSync } from "fs";
import type { Transaction, Category } from "@/lib/types";

const DATA_DIR = join(homedir(), ".fin-cli");
const DB_PATH = join(DATA_DIR, "fin.db");

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new Database(DB_PATH);

export function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      disabled INTEGER NOT NULL DEFAULT 0
    )
  `);

  initializeDefaultCategories();
}

function initializeDefaultCategories() {
  const expenseCategories = [
    "general",
    "utilities",
    "groceries",
    "home",
    "transportation",
    "entertainment",
    "outings",
    "insurance",
  ];
  const incomeCategories = ["work"];

  const stmt = db.prepare(
    "INSERT OR IGNORE INTO categories (name, type) VALUES (?, ?)",
  );

  for (const cat of expenseCategories) {
    stmt.run(cat, "expense");
  }
  for (const cat of incomeCategories) {
    stmt.run(cat, "income");
  }
}

export function addTransaction(
  transaction: Omit<Transaction, "id" | "createdAt">,
) {
  const stmt = db.prepare(
    "INSERT INTO transactions (type, amount, category, date) VALUES (?, ?, ?, ?)",
  );
  return stmt.run(
    transaction.type,
    transaction.amount,
    transaction.category,
    transaction.date,
  );
}

export function getCategories(type?: "income" | "expense"): Category[] {
  const query = type
    ? "SELECT * FROM categories WHERE type = ?"
    : "SELECT * FROM categories";
  const stmt = db.prepare(query);
  return (type ? stmt.all(type) : stmt.all()) as Category[];
}

export function addCategory(name: string, type: "income" | "expense") {
  const stmt = db.prepare("INSERT INTO categories (name, type) VALUES (?, ?)");
  return stmt.run(name, type);
}

export function disableCategory(name: string) {
  const stmt = db.prepare("UPDATE categories SET disabled = 1 WHERE name = ?");
  return stmt.run(name);
}

export function isCategoryDisabled(name: string): boolean {
  const stmt = db.prepare("SELECT disabled FROM categories WHERE name = ?");
  const result = stmt.get(name) as { disabled: number } | undefined;
  return result ? result.disabled === 1 : false;
}

export function getTransactions(
  startDate: string,
  endDate: string,
  categories?: string[],
): Transaction[] {
  let query = `
    SELECT * FROM transactions 
    WHERE date >= ? AND date <= ?
  `;
  const params: any[] = [startDate, endDate];

  if (categories && categories.length > 0) {
    query += ` AND category IN (${categories.map(() => "?").join(",")})`;
    params.push(...categories);
  }

  const stmt = db.prepare(query);
  return stmt.all(...params) as Transaction[];
}
