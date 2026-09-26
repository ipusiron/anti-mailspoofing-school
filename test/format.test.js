const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const files = ['style.css', ...fs.readdirSync(path.join(root, 'js')).map(f => 'js/' + f), ...fs.readdirSync(path.join(root, 'test')).map(f => 'test/' + f)];

test('no minified lines', () => {
  for (const f of files) {
    const longest = Math.max(...read(f).split(/\r?\n/).map(l => l.length));
    assert.ok(longest <= 160, `${f}: ${longest}`);
  }
  const html = Math.max(...read('index.html').split(/\r?\n/).map(l => l.length));
  assert.ok(html <= 250, `index.html: ${html}`);
});

test('files keep their size', () => {
  const minimum = { 'style.css': 1700, 'index.html': 150, 'js/i18n.js': 500, 'js/mailauth-core.js': 150, 'js/mailauth-data.js': 40,
    'js/simulate.js': 200, 'js/challenge.js': 180, 'js/learn.js': 100, 'js/main.js': 50, 'js/challenge-logic.js': 30 };
  for (const [f, n] of Object.entries(minimum)) {
    const lines = read(f).split(/\r?\n/).length;
    assert.ok(lines >= n, `${f}: ${lines} < ${n}`);
  }
});
