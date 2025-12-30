interface Transaction {
  id: number;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
  disabled: boolean;
}

interface CSVRow {
  amount: string;
  date: string;
  category: string;
}

export type { Category, CSVRow, Transaction };
