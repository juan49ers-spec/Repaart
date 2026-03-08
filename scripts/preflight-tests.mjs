import fs from 'node:fs';
import path from 'node:path';

const vitestBin = path.resolve(process.cwd(), 'node_modules', '.bin', 'vitest');

if (!fs.existsSync(vitestBin)) {
  console.error('\n❌ Missing local test dependencies: vitest binary not found.');
  console.error('Run `npm install` (or `npm ci`) and retry `npm run test:ci`.\n');
  process.exit(1);
}

console.log('✅ Preflight ok: vitest binary found.');
