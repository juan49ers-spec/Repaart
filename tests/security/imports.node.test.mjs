import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (error) {
    return (error.stdout || '').toString().trim();
  }
}

test('no active source import should use deprecated services/financeService path', () => {
  const output = run("rg -n \"services/financeService\" src --glob '!src/services/financeService.ts'");

  const lines = output
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !line.includes('OLD: import { financeService }'));

  assert.equal(
    lines.length,
    0,
    `Found deprecated financeService imports:\n${lines.join('\n')}`
  );
});
