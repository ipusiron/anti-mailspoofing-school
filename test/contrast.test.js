const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');

function luminance(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
}
function ratio(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
const vars = {};
const rootBlock = /:root\s*\{([^}]*)\}/.exec(css.slice(css.lastIndexOf('2026-09 improvements')));
for (const [, name, value] of rootBlock[1].matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{3,6})/g)) vars[name] = value;

test('palette variables meet 4.5:1', () => {
  const pairs = [['#ffffff', vars.primary], ['#ffffff', vars['primary-dark']], ['#ffffff', vars.accent], ['#ffffff', vars['accent-dark']],
    ['#ffffff', vars.ok], ['#ffffff', vars.ng], [vars['warn-text'], '#fff8e1'], [vars.muted, '#f8f9fa'], [vars.muted, '#ffffff'],
    [vars.primary, '#ffffff'], [vars.primary, '#eef5fb'], ['#1b5e20', '#e8f5e9'], ['#cbd5e0', '#1a202c'], ['#ffffff', '#6b4e00']];
  assert.equal(Object.keys(vars).length, 9);
  for (const [fg, bg] of pairs) assert.ok(ratio(fg, bg) >= 4.5, `${fg} on ${bg}: ${ratio(fg, bg).toFixed(2)}`);
});

test('the radio buttons stay focusable', () => {
  const override = css.slice(css.lastIndexOf('The radio must stay focusable'));
  assert.match(override, /\.answer-option input\[type="radio"\] \{ display: inline-block;/);
});
