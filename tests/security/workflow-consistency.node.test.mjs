import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const ciPath = path.resolve(repoRoot, '.github/workflows/ci.yml');
const deployPath = path.resolve(repoRoot, '.github/workflows/deploy.yml');
const packageJsonPath = path.resolve(repoRoot, 'package.json');

const ci = fs.readFileSync(ciPath, 'utf8');
const deploy = fs.readFileSync(deployPath, 'utf8');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

test('package scripts expose canonical security/ci entrypoints', () => {
  assert.equal(typeof pkg.scripts['test:unit:coverage'], 'string');
  assert.equal(typeof pkg.scripts['test:security'], 'string');
  assert.equal(typeof pkg.scripts['test:preflight'], 'string');
  assert.equal(typeof pkg.scripts['test:ci'], 'string');
  assert.ok(pkg.scripts['test:ci'].includes('test:preflight'));
});

test('CI workflow uses canonical type-check, unit coverage + security commands', () => {
  assert.ok(ci.includes('name: CI'));
  assert.ok(ci.includes('run: npm run type-check'));
  assert.equal(ci.includes('run: npm run build -- --mode check'), false, 'CI type-check should not depend on build command');
  assert.ok(ci.includes('run: npm run test:unit:coverage'));
  assert.ok(ci.includes('run: npm run test:security'));
  assert.ok(ci.includes('security-regressions'));
  assert.ok(ci.includes('needs: [lint, type-check, test-unit, security-regressions]'));
});

test('deploy workflow test gate uses consolidated test:ci command', () => {
  assert.ok(deploy.includes('name: Deploy to Production'));
  assert.ok(deploy.includes('run: npm run test:ci'));
  assert.equal(deploy.includes('run: npm run test:unit'), false, 'Deploy workflow should avoid duplicated split commands');
  assert.equal(deploy.includes('run: npm run test:security'), false, 'Deploy workflow should rely on test:ci composition');
});


test('no legacy CI/CD Pipeline workflow remains in repository', () => {
  const workflowsDir = path.resolve(repoRoot, '.github/workflows');
  const workflowFiles = fs.readdirSync(workflowsDir);

  assert.equal(workflowFiles.includes('ci-cd.yml'), false, 'Legacy .github/workflows/ci-cd.yml should be removed');
  assert.equal(workflowFiles.includes('ci-cd.yaml'), false, 'Legacy .github/workflows/ci-cd.yaml should be removed');

  for (const file of workflowFiles) {
    const content = fs.readFileSync(path.resolve(workflowsDir, file), 'utf8');
    assert.equal(content.includes('name: CI/CD Pipeline'), false, `Legacy workflow name found in ${file}`);
  }
});
