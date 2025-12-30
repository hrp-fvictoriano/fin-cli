# Project Specification: Fin CLI – Personal Finance Tracker (Updated)

## 1. Overview
Build a Command Line Interface (CLI) tool named `fin` for tracking personal income and expenses. The tool will be developed using **TypeScript** and run on the **Bun** runtime. Data will be persisted locally using a local database or JSON file.

## 2. Technical Stack
- **Runtime:** Bun
- **Language:** TypeScript
- **Argument Parsing:** `util.parseArgs` (Bun native) or `commander`.
- **Data Persistence:** Local (SQLite via `bun:sqlite` or JSON).
- **Formatting:** `console.table` or `cli-table3`.

## 3. Functional Requirements

### 3.1. Transaction Management (`expense` & `income`)
Used to record financial data. Users can provide a single entry via arguments or bulk-import via a CSV file.

**Usage:**
```bash
fin expense <amount> [options]
fin income <amount> [options]
```

**Options:**
- `-f, --file <path>`: Specifies a path to a CSV file. When this flag is used, the `<amount>` positional argument is ignored/not required.
- `--delimiter`: String. Specifies the CSV delimiter. **Defaults to `;`**. Only used in combination with `--file`.
- `-d, --date`: String (YYYY-MM-DD). Defaults to the current date. **May not be used with `--file`.**
- `-c, --category`: String. Defaults to 'general' (expense) or 'work' (income). **May not be used with `--file`.**
    - **Default Expense Categories:** 'general', 'utilities', 'groceries', 'home', 'transportation', 'entertainment', 'outings', 'insurance'.
    - **Default Income Categories:** 'work'.

### 3.2. Category Management (`cat`)
Used to manage the list of available categories. Category names must be unique.

**Usage:**
- `fin cat -l, --list`: Prints all categories for both income and expense. (Cannot be combined with other flags).
- `fin cat -d, --disable <name>`: Accepts a string. Prevents new entries from being assigned to this category.

**Sub-command: `add`**
- `fin cat add income <name>`: Adds a new unique category to the income list.
- `fin cat add expense <name>`: Adds a new unique category to the expense list.

### 3.3. Printing Data (`summary`)
Generates a report of financial statistics. By default, it prints stats for each category for the **current month**.

**Usage:**
- `fin summary [options]`

**Options:**
- `-p, --prev`: Shows the summary for the **previous month**.
- `-y, --year <YYYY>`: Specifies the year to read data from. Defaults to the current year. (Incompatible with `-s` and `-e`).
- `-s, --start <date>`: Start date (YYYY-MM-DD). Defaults to the start of the current month. (Incompatible with `-y`).
- `-e, --end <date>`: End date (YYYY-MM-DD). Defaults to current day. (Incompatible with `-y`).
- `-f, --file <filename>`: Exports the summary to a CSV file instead of the console.
- `--delimiter`: Delimiter for the file output. **Defaults to `;`**.
- `-c, --categories <string>`: A list of specific categories to include; all others will be omitted from the output.

## 4. Business Logic & Constraints
- **Delimiter Logic:** The semicolon (`;`) is the global default. The `--delimiter` flag is only required when the user needs to override this default for imports or exports.
- **Exclusivity:** 
    - When `--file` is used in `expense`/`income`, manual entry flags (`--date`, `--category`) are disabled.
    - When `--prev` is used, it overrides the default "current month" view.
- **Validation:** 
    - Categories must be checked against the "disabled" status before allowing a new transaction.
    - Standardize all date inputs to ensure consistency in the storage layer.

## 5. Output Requirements
- Console summaries should be presented in a clean table format.
- Exported files must follow the delimiter specified (defaulting to `;`).
