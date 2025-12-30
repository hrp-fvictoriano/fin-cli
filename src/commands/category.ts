import { Command } from "commander";
import { getCategories, addCategory, disableCategory } from "@/lib/utils/db";
import Table from "cli-table3";

export function createCategoryCommand() {
  const cat = new Command("cat").description("Manage categories");

  cat
    .option("-l, --list", "List all categories")
    .option("-d, --disable <name>", "Disable a category")
    .action((options) => {
      if (options.list && options.disable) {
        console.error("Error: Cannot use --list and --disable together");
        process.exit(1);
      }

      if (options.list) {
        listCategories();
      } else if (options.disable) {
        disableCategoryAction(options.disable);
      } else {
        cat.help();
      }
    });

  const add = new Command("add").description("Add a new category");

  add
    .command("income <name>")
    .description("Add a new income category")
    .action((name) => {
      addCategoryAction(name, "income");
    });

  add
    .command("expense <name>")
    .description("Add a new expense category")
    .action((name) => {
      addCategoryAction(name, "expense");
    });

  cat.addCommand(add);

  return cat;
}

function listCategories() {
  const categories = getCategories();

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  console.log("\n📊 Income Categories:");
  const incomeTable = new Table({
    head: ["Name", "Status"],
  });

  incomeCategories.forEach((cat) => {
    incomeTable.push([cat.name, cat.disabled ? "Disabled" : "Active"]);
  });
  console.log(incomeTable.toString());

  console.log("\n💰 Expense Categories:");
  const expenseTable = new Table({
    head: ["Name", "Status"],
  });

  expenseCategories.forEach((cat) => {
    expenseTable.push([cat.name, cat.disabled ? "Disabled" : "Active"]);
  });
  console.log(expenseTable.toString());
}

function addCategoryAction(name: string, type: "income" | "expense") {
  try {
    addCategory(name, type);
    console.log(`✓ Added ${type} category: ${name}`);
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint")) {
      console.error(`Error: Category '${name}' already exists`);
    } else {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

function disableCategoryAction(name: string) {
  try {
    const result = disableCategory(name);
    if (result.changes === 0) {
      console.error(`Error: Category '${name}' not found`);
      process.exit(1);
    }
    console.log(`✓ Disabled category: ${name}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}
