#!/usr/bin/env bun

import { Command } from "commander";
import { initDatabase } from "@/lib/utils/db";
import { createExpenseCommand } from "@c/expense";
import { createIncomeCommand } from "@c/income";
import { createCategoryCommand } from "@c/category";
import { createSummaryCommand } from "@c/summary";
import packageJSON from "../package.json" with { type: "json" };

initDatabase();

const program = new Command();

program
  .name("fin")
  .description("Personal finance tracker CLI")
  .version(packageJSON.version);

program.addCommand(createExpenseCommand());
program.addCommand(createIncomeCommand());
program.addCommand(createCategoryCommand());
program.addCommand(createSummaryCommand());

program.parse();
