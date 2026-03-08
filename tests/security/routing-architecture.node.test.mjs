import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appPath = path.resolve(root, 'src/App.tsx');
const dashboardRoutesPath = path.resolve(root, 'src/routes/DashboardAppRoutes.tsx');
const riderRoutesPath = path.resolve(root, 'src/routes/RiderAppRoutes.tsx');

const appSource = fs.readFileSync(appPath, 'utf8');
const dashboardRoutesSource = fs.readFileSync(dashboardRoutesPath, 'utf8');
const riderRoutesSource = fs.readFileSync(riderRoutesPath, 'utf8');

test('App composes routes through extracted route renderers', () => {
  assert.ok(appSource.includes("import { renderDashboardRoutes } from './routes/DashboardAppRoutes';"));
  assert.ok(appSource.includes("import { renderRiderRoutes } from './routes/RiderAppRoutes';"));
  assert.ok(appSource.includes('renderDashboardRoutes({'));
  assert.ok(appSource.includes('renderRiderRoutes({'));
});

test('dashboard route module exposes renderer function and root route', () => {
  assert.ok(dashboardRoutesSource.includes('export function renderDashboardRoutes'));
  assert.ok(dashboardRoutesSource.includes('path="/"'));
  assert.ok(dashboardRoutesSource.includes('DashboardLayout'));
});

test('rider route module exposes renderer function and rider base route', () => {
  assert.ok(riderRoutesSource.includes('export function renderRiderRoutes'));
  assert.ok(riderRoutesSource.includes('path="/rider"'));
  assert.ok(riderRoutesSource.includes('RiderLayout'));
});
