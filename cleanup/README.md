# Cleanup Tool

This directory contains tools to help maintain the repository by identifying and removing unused files, logs, and old documentation.

## Prerequisites

- Node.js
- Git

## Installation

To use the Node.js CLI tool, you need to install its dependencies. It is recommended to do this inside the `cleanup` directory to avoid polluting the root `package.json`.

```bash
cd cleanup
npm install
```

## Usage (Node.js CLI)

The Node.js script provides a robust, interactive way to clean up files.

```bash
# Run in Dry Run mode (default) - Safe to run, no changes made
node cleanup/cli.js

# Apply changes
node cleanup/cli.js --apply

# Skip tests (faster, but less safe)
node cleanup/cli.js --apply --skip-tests

# Specify custom archive directory
node cleanup/cli.js --archive-dir ./my-archive
```

### Features

- Creates a dedicated branch `cleanup/remove-unused-YYYYMMDD`.
- Runs project tests and linting before starting.
- Detects files based on patterns (`*.log`, `*_old.md`, etc.).
- Checks if files are "orphaned" (not referenced in the codebase).
- Interactive menu to Archive, Delete, or Ignore files.
- Generates a report (`report-YYYYMMDD.md`).

## Usage (Bash Script)

A simpler alternative if you don't want to install Node.js dependencies.

```bash
chmod +x cleanup/cleanup.sh
./cleanup/cleanup.sh
```

## Precautions

- Always review the candidates before deleting.
- The tool defaults to **Dry Run** mode.
- Archives are moved to `archive/cleanup-YYYYMMDD/` by default.
- Ensure you have a clean git state before running (though the script creates a new branch).
