import { Command } from "commander";
import { getTransactions } from "@/lib/utils/db";
import {
  getCurrentMonth,
  getPreviousMonth,
  getYearRange,
  formatDate,
} from "@/lib/utils/validators";
import { exportCSV } from "@/lib/utils/csv";
import Table from "cli-table3";

export function createSummaryCommand() {
  const summary = new Command("summary")
    .description("Generate financial summary")
    .option("-p, --prev", "Show previous month")
    .option("-y, --year <YYYY>", "Show entire year")
    .option("-s, --start <YYYY-MM-DD>", "Start date")
    .option("-e, --end <YYYY-MM-DD>", "End date")
    .option("-f, --file <filename>", "Export to CSV file")
    .option("--delimiter <char>", "CSV delimiter", ";")
    .option(
      "-c, --categories <items>",
      "Filter by categories (comma-separated)",
    )
    .action((options) => {
      generateSummary(options);
    });

  return summary;
}

function generateSummary(options: any) {
  if (options.year && (options.start || options.end)) {
    console.error("Error: Cannot use --year with --start or --end");
    process.exit(1);
  }

  let startDate: string;
  let endDate: string;

  if (options.prev) {
    const range = getPreviousMonth();
    startDate = range.start;
    endDate = range.end;
  } else if (options.year) {
    const year = parseInt(options.year);
    if (isNaN(year)) {
      console.error("Error: Invalid year");
      process.exit(1);
    }
    const range = getYearRange(year);
    startDate = range.start;
    endDate = range.end;
  } else {
    const current = getCurrentMonth();
    startDate = options.start || current.start;
    endDate = options.end || formatDate(new Date());
  }

  const categoryFilter = options.categories
    ? options.categories.split(",").map((c: string) => c.trim())
    : undefined;

  const transactions = getTransactions(startDate, endDate, categoryFilter);

  const summary: {
    [category: string]: { income: number; expense: number };
  } = {};

  transactions.forEach((t) => {
    if (!summary[t.category]) {
      summary[t.category] = { income: 0, expense: 0 };
    }
    //@ts-ignore
    summary[t.category][t.type] += t.amount;
  });

  const summaryData = Object.entries(summary).map(([category, data]) => ({
    category,
    income: data.income.toFixed(2),
    expense: data.expense.toFixed(2),
    net: (data.income - data.expense).toFixed(2),
  }));

  const totalIncome = summaryData.reduce(
    (sum, row) => sum + parseFloat(row.income),
    0,
  );
  const totalExpense = summaryData.reduce(
    (sum, row) => sum + parseFloat(row.expense),
    0,
  );
  const totalNet = totalIncome - totalExpense;

  summaryData.push({
    category: "TOTAL",
    income: totalIncome.toFixed(2),
    expense: totalExpense.toFixed(2),
    net: totalNet.toFixed(2),
  });

  if (options.file) {
    exportCSV(summaryData, options.file, options.delimiter);
    console.log(`✓ Summary exported to ${options.file}`);
  } else {
    console.log(`\n📊 Financial Summary (${startDate} to ${endDate})\n`);
    const table = new Table({
      head: ["Category", "Income", "Expense", "Net"],
    });

    summaryData.forEach((row) => {
      table.push([
        row.category,
        "$" + row.income,
        "$" + row.expense,
        "$" + row.net,
      ]);
    });

    console.log(table.toString());
  }
}
