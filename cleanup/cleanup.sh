#!/bin/bash

# Cleanup Script (Bash Version)
# Usage: ./cleanup.sh

DATE_STR=$(date +%Y%m%d)
BRANCH_NAME="cleanup/remove-unused-$DATE_STR"
ARCHIVE_DIR="archive/cleanup-$DATE_STR"

echo "=== Cleanup Script Started ==="

# 1. Create Branch
echo "Step 1: Creating branch $BRANCH_NAME..."
git checkout -b "$BRANCH_NAME" || git checkout "$BRANCH_NAME"

# 2. Run Checks
echo "Step 2: Running checks..."
if [ -f "package.json" ]; then
    echo "Running npm test..."
    npm test
    if [ $? -ne 0 ]; then
        echo "Tests failed! Aborting."
        exit 1
    fi
fi

# 3. Preview Cleanable Files
echo "Step 3: Previewing ignored and untracked files..."
echo "--- Ignored files (git clean -ndX) ---"
git clean -ndX
echo "--- Untracked files (git clean -fdn) ---"
git clean -fdn

# 4. Find Candidates (Simple grep for patterns)
echo "Step 4: Searching for candidates..."
PATTERNS=("*.log" "*.tmp" "*.bak" "*_old.md" "docs-old")
CANDIDATES=()

for p in "${PATTERNS[@]}"; do
    # Find files matching pattern, excluding node_modules and .git
    found=$(find . -type f -name "$p" -not -path "*/node_modules/*" -not -path "*/.git/*")
    if [ ! -z "$found" ]; then
        for f in $found; do
            CANDIDATES+=("$f")
        done
    fi
done

echo "Found ${#CANDIDATES[@]} candidates."

# 5. Interactive Loop
mkdir -p "$ARCHIVE_DIR"

for file in "${CANDIDATES[@]}"; do
    echo "------------------------------------------------"
    echo "File: $file"
    echo "Checking references..."
    git grep -q "$(basename "$file")"
    if [ $? -eq 0 ]; then
        echo "  [!] Referenced in code."
    else
        echo "  [?] No references found (Orphan?)."
    fi

    read -p "Action? [a]rchive / [d]elete / [i]gnore: " action
    case $action in
        a)
            echo "Archiving $file..."
            # Preserve parent dir structure in archive is tricky in bash simple script, 
            # just moving flat or simple cp --parents if available
            cp --parents "$file" "$ARCHIVE_DIR" 2>/dev/null || cp "$file" "$ARCHIVE_DIR"
            git rm "$file" 2>/dev/null || rm "$file"
            ;;
        d)
            echo "Deleting $file..."
            git rm "$file" 2>/dev/null || rm "$file"
            ;;
        *)
            echo "Ignoring."
            ;;
    esac
done

# 6. Finish
echo "Step 6: Finalizing..."
git status
echo "If you are happy with changes:"
echo "  git add -A"
echo "  git commit -m 'chore(cleanup): remove unused files'"
echo "  git push origin $BRANCH_NAME"
