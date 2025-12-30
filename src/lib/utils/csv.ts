import { readFileSync, writeFileSync } from "fs";
import type { CSVRow } from "@/lib/types";

export function parseCSV(filePath: string, delimiter: string = ";"): CSVRow[] {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");

  if (lines.length < 2) {
    throw new Error("CSV file must contain headers and at least one row");
  }
  //@ts-ignore
  const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());
  const requiredHeaders = ["amount", "date", "category"];

  for (const header of requiredHeaders) {
    if (!headers.includes(header)) {
      throw new Error(`CSV missing required header: ${header}`);
    }
  }

  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    //@ts-ignore
    const values = lines[i].split(delimiter);
    const row: any = {};

    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || "";
    });

    rows.push({
      amount: row.amount,
      date: row.date,
      category: row.category,
    });
  }

  return rows;
}

export function exportCSV(
  data: any[],
  filePath: string,
  delimiter: string = ";",
) {
  if (data.length === 0) {
    throw new Error("No data to export");
  }

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(delimiter),
    ...data.map((row) =>
      headers.map((header) => row[header] || "").join(delimiter),
    ),
  ].join("\n");

  writeFileSync(filePath, csv, "utf-8");
}
