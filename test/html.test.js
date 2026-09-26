const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const jsFiles = fs.readdirSync(path.join(root, 'js')).map(f => [f, fs.readFileSync(path.join(root, 'js', f), 'utf8')]);

test('CSP, referrer and noscript', () => {
  const csp = /<meta http-equiv="Content-Security-Policy" content="([^"]+)">/.exec(html);
  assert.ok(csp, 'meta CSP');
  assert.match(csp[1], /script-src 'self'/);
  assert.match(csp[1], /style-src 'self'/);
  assert.doesNotMatch(csp[1], /unsafe-inline|unsafe-eval|frame-ancestors/);
  assert.match(html, /<meta name="referrer" content="no-referrer">/);
  assert.match(html, /<noscript>/);
});

test('no inline handlers, inline styles or inline scripts', () => {
  assert.doesNotMatch(html, /\son[a-z]+="/i);
  assert.doesNotMatch(html, /\sstyle="/i);
  assert.doesNotMatch(html, /<script>(?!<\/script>)/);
  assert.doesNotMatch(html, /<style/);
});

test('tabs, dialog, labels and links', () => {
  assert.match(html, /role="tablist"/);
  for (const id of ['learn', 'simulate', 'challenge', 'checker', 'headers']) {
    assert.match(html, new RegExp(`role="tab" id="tab-${id}" aria-controls="${id}" aria-selected="(true|false)"`));
    assert.match(html, new RegExp(`id="${id}" class="tab-content[^"]*" role="tabpanel" aria-labelledby="tab-${id}"`));
  }
  assert.match(html, /<dialog id="help-modal"[^>]*aria-labelledby="help-title"/);
  for (const [, id] of html.matchAll(/<label for="([^"]+)"/g)) assert.match(html, new RegExp(`id="${id}"`), id);
  for (const [tag] of html.matchAll(/<button\b[^>]*>/g)) assert.match(tag, /type="button"|type="submit"/, tag);
  for (const [tag] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) assert.match(tag, /rel="noopener noreferrer"/);
});

test('scripts avoid innerHTML, style writes, alert and inline handlers', () => {
  for (const [name, src] of jsFiles) {
    for (const bad of ['innerHTML', 'insertAdjacentHTML', 'outerHTML', '.style.', 'alert(', 'onclick', 'eval(', 'fetch(', 'XMLHttpRequest']) {
      assert.ok(!src.includes(bad), `${name} contains ${bad}`);
    }
  }
});

test('the core does not use the DOM', () => {
  for (const name of ['mailauth-core.js', 'mailauth-tools.js', 'mailauth-data.js', 'challenge-logic.js']) {
    const src = jsFiles.find(([f]) => f === name)[1];
    assert.ok(!/document\.|window\.|localStorage/.test(src), name);
  }
});

test('script order: dictionary and core before the UI', () => {
  const order = [...html.matchAll(/<script src="js\/([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(order, ['i18n.js', 'mailauth-core.js', 'mailauth-tools.js', 'mailauth-data.js', 'main.js', 'learn.js', 'simulate.js',
    'challenge-logic.js', 'challenge.js', 'checker.js', 'headers.js']);
});
