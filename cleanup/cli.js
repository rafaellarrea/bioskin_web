#!/usr/bin/env node

/**
 * Cleanup CLI Tool
 * 
 * Usage:
 *   node cleanup/cli.js [options]
 * 
 * Options:
 *   --dry              Run in dry-run mode (default: true). No files are deleted.
 *   --apply            Apply changes (disable dry-run).
 *   --patterns <file>  Path to a JSON file containing extra glob patterns to search.
 *   --archive-dir <path> Directory to move archived files to.
 *   --skip-tests       Skip running npm test/lint checks.
 * 
 * Examples:
 *   node cleanup/cli.js --dry
 *   node cleanup/cli.js --apply --skip-tests
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const inquirer = require('inquirer');
const execa = require('execa');
const chalk = require('chalk');
const minimist = require('minimist');

// Configuration
const ARGS = minimist(process.argv.slice(2), {
    boolean: ['dry', 'apply', 'skip-tests'],
    string: ['patterns', 'archive-dir'],
    default: {
        dry: true,
        apply: false,
        'skip-tests': false
    }
});

// Force dry run unless --apply is explicitly passed
const IS_DRY_RUN = !ARGS.apply;
const DATE_STR = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const BRANCH_NAME = `cleanup/remove-unused-${DATE_STR}`;
const DEFAULT_ARCHIVE_DIR = ARGS['archive-dir'] || `archive/cleanup-${DATE_STR}`;
const REPORT_FILE_JSON = `cleanup/report-${DATE_STR}.json`;
const REPORT_FILE_MD = `cleanup/report-${DATE_STR}.md`;

// Default patterns
const DEFAULT_PATTERNS = [
    '**/docs-old/**',
    '**/docs_backup/**',
    '**/*_old.md',
    '**/*.log',
    '**/*.tmp',
    '**/*.bak',
    '.DS_Store',
    '**/__pycache__/**',
    '**/*.test.log'
];

// State
const state = {
    candidates: [],
    actions: [], // { file, action: 'archive' | 'delete' | 'ignore' }
    stats: {
        archived: 0,
        deleted: 0,
        ignored: 0,
        bytesSaved: 0
    }
};

// Helpers
const log = {
    info: (msg) => console.log(chalk.blue('ℹ'), msg),
    success: (msg) => console.log(chalk.green('✔'), msg),
    warn: (msg) => console.log(chalk.yellow('⚠'), msg),
    error: (msg) => console.log(chalk.red('✖'), msg),
    header: (msg) => console.log(chalk.bold.cyan(`\n=== ${msg} ===\n`))
};

async function runCommand(command, args, opts = {}) {
    log.info(`Running: ${command} ${args.join(' ')}`);
    try {
        const { stdout } = await execa(command, args, { stdio: 'inherit', ...opts });
        return stdout;
    } catch (error) {
        log.error(`Command failed: ${command} ${args.join(' ')}`);
        throw error;
    }
}

async function createBranch() {
    log.header('Step 1: Branch Creation');
    try {
        const currentBranch = (await execa('git', ['branch', '--show-current'])).stdout.trim();
        if (currentBranch === BRANCH_NAME) {
            log.info(`Already on branch ${BRANCH_NAME}`);
            return;
        }
        
        // Check if branch exists
        try {
            await execa('git', ['rev-parse', '--verify', BRANCH_NAME]);
            log.info(`Branch ${BRANCH_NAME} exists. Checking out...`);
            await execa('git', ['checkout', BRANCH_NAME]);
        } catch (e) {
            log.info(`Creating new branch ${BRANCH_NAME}...`);
            await execa('git', ['checkout', '-b', BRANCH_NAME]);
        }
        log.success(`Switched to branch ${BRANCH_NAME}`);
    } catch (error) {
        log.error('Failed to manage git branch.');
        process.exit(1);
    }
}

async function runChecks() {
    if (ARGS['skip-tests']) {
        log.warn('Skipping tests and linting checks as requested.');
        return;
    }

    log.header('Step 2: Pre-checks');
    
    try {
        // Detect package manager
        const hasPackageJson = await fs.pathExists('package.json');
        
        if (hasPackageJson) {
            log.info('Detected Node.js project.');
            // npm ci (optional, might take too long, maybe just ensure install)
            // await runCommand('npm', ['ci']); 
            
            log.info('Running Lint...');
            try {
                await runCommand('npm', ['run', 'lint']);
            } catch (e) {
                log.warn('Linting failed or script not found. Continuing...');
            }

            log.info('Running Tests...');
            try {
                await runCommand('npm', ['test']);
            } catch (e) {
                log.error('Tests failed! Aborting cleanup to ensure stability.');
                process.exit(1);
            }

            // Coverage
            log.info('Generating Coverage...');
            try {
                await runCommand('npm', ['run', 'coverage']);
            } catch (e) {
                log.warn('Coverage generation failed or script not found.');
            }
        } else {
            log.warn('No package.json found. Skipping Node.js specific checks.');
        }
    } catch (error) {
        log.error('Pre-checks failed.');
        process.exit(1);
    }
}

async function findCandidates() {
    log.header('Step 3: Detecting Candidates');

    let patterns = [...DEFAULT_PATTERNS];
    if (ARGS.patterns) {
        try {
            const extraPatterns = await fs.readJson(ARGS.patterns);
            patterns = [...patterns, ...extraPatterns];
        } catch (e) {
            log.error(`Could not read patterns file: ${ARGS.patterns}`);
        }
    }

    // 1. Pattern matching
    for (const pattern of patterns) {
        const files = glob.sync(pattern, { ignore: ['node_modules/**', '.git/**', 'cleanup/**'] });
        for (const file of files) {
            if (fs.lstatSync(file).isFile()) {
                addCandidate(file, 'pattern', `Matches ${pattern}`);
            }
        }
    }

    // 2. Orphan detection (Simple heuristic: git grep)
    // This is expensive, so we might limit it or do it only for specific folders if configured.
    // For now, let's check the candidates we already found to see if they are referenced?
    // Or should we scan ALL files? Scanning all files is too risky/slow.
    // The prompt says: "Detectar archivos 'huérfanos' sin referencias: para cada archivo candidato..."
    // So we only check if the *candidates* are referenced.
    
    // Wait, usually "orphan" means files that are NOT in the pattern list but are unused.
    // But the prompt says "para cada archivo candidato, buscar si aparece...".
    // This implies we verify if the candidates found by patterns are indeed unused.
    // AND maybe finding other orphans?
    // "Detectar candidatos a eliminar/archivar: ... Detectar archivos 'huérfanos'..."
    // I will interpret this as: Check if the files found by patterns are actually referenced.
    // If they are referenced, maybe we shouldn't delete them blindly.
    
    for (const candidate of state.candidates) {
        const filename = path.basename(candidate.path);
        try {
            // git grep returns 0 if found, 1 if not found
            // We search for the filename in the codebase
            await execa('git', ['grep', '-q', filename]);
            candidate.referenced = true;
            candidate.notes += ' (Referenced in code)';
        } catch (e) {
            candidate.referenced = false;
            candidate.notes += ' (No references found)';
        }
    }

    log.info(`Found ${state.candidates.length} candidates.`);
}

function addCandidate(filePath, type, reason) {
    // Avoid duplicates
    if (state.candidates.find(c => c.path === filePath)) return;

    const stats = fs.statSync(filePath);
    state.candidates.push({
        path: filePath,
        size: stats.size,
        mtime: stats.mtime,
        type,
        reason,
        notes: '',
        referenced: null // checked later
    });
}

async function interactiveMenu() {
    log.header('Step 4: Interactive Review');

    if (state.candidates.length === 0) {
        log.info('No candidates found to clean up.');
        return;
    }

    const choices = state.candidates.map(c => ({
        name: `${c.path} (${(c.size / 1024).toFixed(1)}KB) - ${chalk.gray(c.reason)} ${c.referenced ? chalk.red('[REF]') : chalk.green('[ORPHAN]')}`,
        value: c,
        short: c.path
    }));

    // Group by type for bulk actions?
    // For simplicity in this script, we'll ask for a mode.
    
    const { mode } = await inquirer.prompt([{
        type: 'list',
        name: 'mode',
        message: 'How do you want to review candidates?',
        choices: [
            { name: 'Review one by one', value: 'one' },
            { name: 'Bulk select (Checkbox)', value: 'bulk' },
            { name: 'Archive ALL orphans (Skip referenced)', value: 'archive_orphans' },
            { name: 'Ignore all (Exit)', value: 'exit' }
        ]
    }]);

    if (mode === 'exit') return;

    if (mode === 'archive_orphans') {
        state.candidates.forEach(c => {
            if (!c.referenced) {
                state.actions.push({ file: c, action: 'archive' });
            } else {
                state.actions.push({ file: c, action: 'ignore' });
            }
        });
        return;
    }

    if (mode === 'bulk') {
        const { selected } = await inquirer.prompt([{
            type: 'checkbox',
            name: 'selected',
            message: 'Select files to process (Default action will be asked next)',
            choices: choices,
            pageSize: 20
        }]);

        if (selected.length > 0) {
            const { action } = await inquirer.prompt([{
                type: 'list',
                name: 'action',
                message: 'What to do with selected files?',
                choices: [
                    { name: 'Archive', value: 'archive' },
                    { name: 'Delete', value: 'delete' },
                    { name: 'Ignore', value: 'ignore' }
                ]
            }]);

            state.candidates.forEach(c => {
                if (selected.includes(c)) {
                    state.actions.push({ file: c, action });
                } else {
                    state.actions.push({ file: c, action: 'ignore' });
                }
            });
        }
        return;
    }

    if (mode === 'one') {
        for (const candidate of state.candidates) {
            log.info(`\nFile: ${chalk.bold(candidate.path)}`);
            log.info(`Size: ${candidate.size} bytes`);
            log.info(`Reason: ${candidate.reason}`);
            log.info(`Notes: ${candidate.notes}`);

            const { action } = await inquirer.prompt([{
                type: 'list',
                name: 'action',
                message: 'Action?',
                choices: [
                    { name: 'Archive', value: 'archive' },
                    { name: 'Delete', value: 'delete' },
                    { name: 'Ignore', value: 'ignore' }
                ]
            }]);
            
            state.actions.push({ file: candidate, action });
        }
    }
}

async function executeActions() {
    log.header('Step 5: Execution');

    if (IS_DRY_RUN) {
        log.warn('DRY RUN MODE: No changes will be applied.');
    }

    const toArchive = state.actions.filter(a => a.action === 'archive');
    const toDelete = state.actions.filter(a => a.action === 'delete');

    log.info(`Summary:
    - Archive: ${toArchive.length} files
    - Delete: ${toDelete.length} files
    - Ignore: ${state.actions.filter(a => a.action === 'ignore').length} files
    `);

    if (toArchive.length === 0 && toDelete.length === 0) {
        log.info('No actions to perform.');
        return;
    }

    if (!IS_DRY_RUN) {
        const { confirm } = await inquirer.prompt([{
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to apply these changes?',
            default: false
        }]);

        if (!confirm) {
            log.warn('Aborted by user.');
            return;
        }
    }

    // Process Archives
    for (const { file } of toArchive) {
        const dest = path.join(DEFAULT_ARCHIVE_DIR, file.path);
        if (IS_DRY_RUN) {
            log.info(`[DRY] Would move ${file.path} -> ${dest}`);
        } else {
            try {
                await fs.move(file.path, dest, { overwrite: true });
                state.stats.archived++;
                state.stats.bytesSaved += file.size;
            } catch (e) {
                log.error(`Failed to archive ${file.path}: ${e.message}`);
            }
        }
    }

    // Process Deletes
    for (const { file } of toDelete) {
        if (IS_DRY_RUN) {
            log.info(`[DRY] Would delete ${file.path}`);
        } else {
            try {
                // Try git rm first if tracked
                try {
                    await execa('git', ['rm', file.path]);
                } catch (e) {
                    // Fallback to fs.unlink if not tracked or git failed
                    await fs.remove(file.path);
                }
                state.stats.deleted++;
                state.stats.bytesSaved += file.size;
            } catch (e) {
                log.error(`Failed to delete ${file.path}: ${e.message}`);
            }
        }
    }

    if (!IS_DRY_RUN) {
        await generateReport();
        await commitAndSuggestPR();
    }
}

async function generateReport() {
    const report = {
        date: new Date().toISOString(),
        branch: BRANCH_NAME,
        stats: state.stats,
        actions: state.actions.map(a => ({
            file: a.file.path,
            action: a.action,
            size: a.file.size
        }))
    };

    await fs.writeJson(REPORT_FILE_JSON, report, { spaces: 2 });
    
    const mdReport = `
# Cleanup Report - ${DATE_STR}

**Branch:** ${BRANCH_NAME}
**Date:** ${new Date().toLocaleString()}

## Stats
- **Archived:** ${state.stats.archived} files
- **Deleted:** ${state.stats.deleted} files
- **Space Reclaimed:** ${(state.stats.bytesSaved / 1024).toFixed(2)} KB

## Details
| File | Action | Size |
|------|--------|------|
${state.actions.filter(a => a.action !== 'ignore').map(a => `| ${a.file.path} | ${a.action} | ${a.file.size} |`).join('\n')}
    `;

    await fs.writeFile(REPORT_FILE_MD, mdReport);
    log.success(`Reports generated: ${REPORT_FILE_JSON}, ${REPORT_FILE_MD}`);
}

async function commitAndSuggestPR() {
    log.header('Step 6: Commit & PR');
    
    try {
        await execa('git', ['add', '-A']);
        await execa('git', ['commit', '-m', `chore(cleanup): archive/remove unused files (${DATE_STR})`]);
        log.success('Changes committed.');

        log.info('To push and create PR, run:');
        console.log(chalk.cyan(`
    git push -u origin ${BRANCH_NAME}
    gh pr create --title "chore(cleanup): remove unused files ${DATE_STR}" --body "Automated cleanup run. See ${REPORT_FILE_MD} for details."
        `));
    } catch (e) {
        log.error('Failed to commit changes. Check git status.');
    }
}

async function main() {
    log.header('Cleanup Tool Started');
    if (IS_DRY_RUN) log.warn('Running in DRY RUN mode. Use --apply to execute changes.');

    await createBranch();
    await runChecks();
    await findCandidates();
    await interactiveMenu();
    await executeActions();

    log.success('Done.');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
