import { Command } from "commander";
import {
  addTransaction,
  getCategories,
  isCategoryDisabled,
} from "@/lib/utils/db";
import { validateDate, formatDate } from "@/lib/utils/validators";
import { parseCSV } from "@/lib/utils/csv";

export function createExpenseCommand() {
  const expense = new Command("expense")
    .description("Record an expense")
    .argument("[amount]", "Expense amount")
    .option("-f, --file <path>", "Import from CSV file")
    .option("--delimiter <char>", "CSV delimiter", ";")
    .option("-d, --date <YYYY-MM-DD>", "Transaction date")
    .option("-c, --category <name>", "Expense category", "general")
    .action(async (amount, options) => {
      if (options.file) {
        if (options.date || options.category !== "general") {
          console.error(
            "Error: --date and --category cannot be used with --file",
          );
          process.exit(1);
        }
        await importFromCSV(options.file, options.delimiter);
      } else {
        if (!amount) {
          console.error("Error: amount is required");
          process.exit(1);
        }
        await addSingleExpense(
          parseFloat(amount),
          options.category,
          options.date,
        );
      }
    });

  return expense;
}

async function addSingleExpense(
  amount: number,
  category: string,
  dateStr?: string,
) {
  if (isNaN(amount) || amount <= 0) {
    console.error("Error: Invalid amount");
    process.exit(1);
  }

  const categories = getCategories("expense");
  const validCategory = categories.find((c) => c.name === category);

  if (!validCategory) {
    console.error(`Error: Category '${category}' does not exist`);
    process.exit(1);
  }

  if (isCategoryDisabled(category)) {
    console.error(`Error: Category '${category}' is disabled`);
    process.exit(1);
  }

  const date = dateStr || formatDate(new Date());
  if (!validateDate(date)) {
    console.error("Error: Invalid date format. Use YYYY-MM-DD");
    process.exit(1);
  }

  addTransaction({
    type: "expense",
    amount,
    category,
    date,
  });

  console.log(`✓ Expense recorded: $${amount} in ${category} on ${date}`);
}

async function importFromCSV(filePath: string, delimiter: string) {
  try {
    const rows = parseCSV(filePath, delimiter);
    let successCount = 0;

    for (const row of rows) {
      const amount = parseFloat(row.amount);
      if (isNaN(amount) || amount <= 0) {
        console.warn(`Skipping invalid amount: ${row.amount}`);
        continue;
      }

      if (!validateDate(row.date)) {
        console.warn(`Skipping invalid date: ${row.date}`);
        continue;
      }

      if (isCategoryDisabled(row.category)) {
        console.warn(`Skipping disabled category: ${row.category}`);
        continue;
      }

      addTransaction({
        type: "expense",
        amount,
        category: row.category,
        date: row.date,
      });
      successCount++;
    }

    console.log(`✓ Imported ${successCount} expense(s) from ${filePath}`);
  } catch (error: any) {
    console.error(`Error importing CSV: ${error.message}`);
    process.exit(1);
  }
}
