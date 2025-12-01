const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Simple mock test for the CLI logic concepts
// Since we can't easily test the interactive CLI without complex mocking,
// we will test the helper logic if we had extracted it.
// For now, we verify the file structure and basic requirements.

console.log('Running Cleanup Tool Tests...');

const cleanupDir = path.resolve(__dirname, '..');
const cliPath = path.join(cleanupDir, 'cli.js');
const shPath = path.join(cleanupDir, 'cleanup.sh');

// Test 1: Files exist
assert.ok(fs.existsSync(cliPath), 'cli.js should exist');
assert.ok(fs.existsSync(shPath), 'cleanup.sh should exist');

// Test 2: Package.json has dependencies
const pkg = require('../package.json');
assert.ok(pkg.dependencies['inquirer'], 'inquirer should be a dependency');
assert.ok(pkg.dependencies['glob'], 'glob should be a dependency');

console.log('✔ Basic structure tests passed.');

// Test 3: Mock Pattern Matching (Logic check)
const glob = require('glob');
// We can't easily run glob on the real fs without knowing what's there, 
// but we can check if the module loads.
assert.ok(glob, 'glob module should load');

console.log('✔ Dependency checks passed.');
console.log('All tests passed!');
