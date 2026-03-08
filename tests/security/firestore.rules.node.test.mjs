import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const rules = fs.readFileSync(rulesPath, 'utf8');

function extractMatchBlock(matchPath) {
  const key = `match ${matchPath}`;
  const start = rules.indexOf(key);
  assert.notEqual(start, -1, `Missing rules block: ${matchPath}`);

  const openBrace = rules.indexOf('{', start + key.length);
  assert.notEqual(openBrace, -1, `Missing opening brace for: ${matchPath}`);

  let depth = 1;
  let i = openBrace + 1;

  while (i < rules.length && depth > 0) {
    if (rules[i] === '{') depth += 1;
    if (rules[i] === '}') depth -= 1;
    i += 1;
  }

  assert.equal(depth, 0, `Unbalanced braces in block: ${matchPath}`);
  return rules.slice(start, i);
}

function extractAllowExpression(block, method) {
  const methodPattern = method.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`allow\\s+${methodPattern}\\s*:\\s*if\\s*([\\s\\S]*?);`, 'g');
  const matches = [];
  let m;

  while ((m = regex.exec(block)) !== null) {
    matches.push(m[1]);
  }

  return matches;
}

const ticketsBlock = extractMatchBlock('/tickets/{ticketId}');
const notificationsBlock = extractMatchBlock('/notifications/{notificationId}');

test('tickets keeps separated ownership and elevated read rules', () => {
  const readExpressions = extractAllowExpression(ticketsBlock, 'read');

  assert.ok(readExpressions.length >= 2, 'Expected at least two allow read clauses for tickets');
  assert.ok(ticketsBlock.includes('resource.data.userId == request.auth.uid'));
  assert.ok(ticketsBlock.includes('resource.data.createdBy == request.auth.uid'));
  assert.ok(ticketsBlock.includes('isAdmin()'));
  assert.ok(ticketsBlock.includes('resource.data.franchiseId == getUserData().franchiseId'));
});

test('tickets write is not globally open', () => {
  const writeExpressions = extractAllowExpression(ticketsBlock, 'write');
  assert.equal(writeExpressions.length, 1, 'Expected exactly one tickets write rule');

  const writeExpr = writeExpressions[0];
  assert.ok(writeExpr.includes('isAdmin()'));
  assert.ok(writeExpr.includes('resource.data.userId == request.auth.uid'));
  assert.equal(writeExpr.includes('isFranchise()'), false, 'tickets write should not be franchise-wide');
});

test('tickets create is validated and authenticated', () => {
  const createExpressions = extractAllowExpression(ticketsBlock, 'create');
  assert.ok(createExpressions.length >= 1, 'Expected at least one tickets create rule');

  const hasValidatedTicketCreate = createExpressions.some(expr => expr.includes('isAuthed()') && expr.includes('isValidTicket()'));
  assert.equal(hasValidatedTicketCreate, true, 'Expected a validated tickets create rule with auth + schema checks');
});

test('tickets does not expose broad read,write shortcut', () => {
  const broadRule = /allow\s+read\s*,\s*write\s*:\s*if\s+isAuthed\s*\(\s*\)\s*;/m;
  assert.equal(broadRule.test(ticketsBlock), false, 'tickets should not allow broad read,write for any authed user');
});

test('notifications get/list keep user filter and elevated paths', () => {
  const listExpressions = extractAllowExpression(notificationsBlock, 'list');
  assert.equal(listExpressions.length, 1, 'Expected one notifications list rule');

  const listExpr = listExpressions[0];
  assert.ok(listExpr.includes('request.query.filters.userId == request.auth.uid'));
  assert.ok(listExpr.includes('isAdmin()'));
  assert.ok(listExpr.includes('isFranchise()'));

  const getExpressions = extractAllowExpression(notificationsBlock, 'get');
  assert.equal(getExpressions.length, 1, 'Expected one notifications get rule');

  const getExpr = getExpressions[0];
  assert.ok(getExpr.includes('resource.data.userId == request.auth.uid'));
  assert.ok(getExpr.includes('isAdmin()'));
  assert.ok(getExpr.includes('resource.data.userId == getUserData().franchiseId'));
});

test('notifications create requires schema validation', () => {
  const createExpressions = extractAllowExpression(notificationsBlock, 'create');
  assert.equal(createExpressions.length, 1, 'Expected one notifications create rule');

  const createExpr = createExpressions[0];
  assert.ok(createExpr.includes('isAuthed()'));
  assert.ok(createExpr.includes('isValidNotification()'));
});

test('notifications write keeps owner/admin/franchise checks', () => {
  const writeExpressions = extractAllowExpression(notificationsBlock, 'write');
  assert.equal(writeExpressions.length, 1, 'Expected one notifications write rule');

  const writeExpr = writeExpressions[0];
  assert.ok(writeExpr.includes('request.auth.uid == resource.data.userId'));
  assert.ok(writeExpr.includes('isAdmin()'));
  assert.ok(writeExpr.includes('request.auth.uid == getUserData().franchiseId'));
});

test('notifications does not expose broad read/write shortcut', () => {
  const broadRule = /allow\s+read\s*,\s*write\s*:\s*if\s+isAuthed\s*\(\s*\)\s*;/m;
  assert.equal(broadRule.test(notificationsBlock), false, 'notifications should not allow broad read,write for any authed user');
});
