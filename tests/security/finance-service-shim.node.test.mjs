import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const shimPath = path.resolve(process.cwd(), 'src/services/financeService.ts');
const shimSource = fs.readFileSync(shimPath, 'utf8');

test('deprecated financeService shim stays as compatibility re-export', () => {
  assert.ok(shimSource.includes('@deprecated'), 'Expected shim to be explicitly marked deprecated');
  assert.ok(
    shimSource.includes("export { financeService } from './finance';"),
    'Expected shim to re-export financeService from canonical module'
  );
});

test('deprecated shim keeps type re-exports from canonical finance module', () => {
  assert.ok(shimSource.includes("from './finance'"), 'Expected type re-exports to come from ./finance');
  assert.ok(shimSource.includes("from '../types/finance'"), 'Expected finance domain types to remain re-exported');
});
