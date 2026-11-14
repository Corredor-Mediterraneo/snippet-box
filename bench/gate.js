#!/usr/bin/env node
/**
 * Gate script: verifies the project compiles correctly.
 * Exits 0 on success, 1 on failure.
 */

const { execSync } = require('child_process');
const path = require('path');

const root = process.cwd();

console.error('Running TypeScript compilation check...');
try {
  execSync('npx tsc --noEmit', { cwd: root, stdio: 'inherit' });
  console.error('Compilation check passed.');
  process.exit(0);
} catch (err) {
  console.error('Compilation check failed.');
  process.exit(1);
}
