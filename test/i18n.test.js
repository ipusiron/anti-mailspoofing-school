const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const I18n = require('../js/i18n.js');
const root = path.join(__dirname, '..');

const JAPANESE = new RegExp('[' + String.fromCodePoint(0x3040) + '-' + String.fromCodePoint(0x30ff) +
  String.fromCodePoint(0x4e00) + '-' + String.fromCodePoint(0x9fff) + String.fromCodePoint(0xff01) + '-' + String.fromCodePoint(0xff60) + ']');

test('Japanese and English have the same non-empty keys and placeholders', () => {
  assert.deepEqual(Object.keys(I18n.ja).sort(), Object.keys(I18n.en).sort());
  for (const key of Object.keys(I18n.ja)) {
    for (const lang of ['ja', 'en']) assert.ok(I18n[lang][key].trim(), `${lang}.${key}`);
    assert.deepEqual((I18n.ja[key].match(/\{\w+\}/g) || []).sort(), (I18n.en[key].match(/\{\w+\}/g) || []).sort(), key);
  }
});

test('English messages contain no Japanese', () => {
  for (const [key, value] of Object.entries(I18n.en)) {
    if (key === 'app.langButton') continue;             // the button that switches back to Japanese
    assert.doesNotMatch(value, JAPANESE, key);
  }
});

test('every key used by the markup and scripts exists', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const keys = [...html.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)].map(m => m[1]);
  for (const file of fs.readdirSync(path.join(root, 'js'))) {
    const src = fs.readFileSync(path.join(root, 'js', file), 'utf8');
    keys.push(...[...src.matchAll(/I18n\.t\('([^'`$]+)'/g)].map(m => m[1]));
  }
  assert.ok(keys.length > 60);
  for (const key of keys) assert.ok(Object.hasOwn(I18n.ja, key), key);
});

test('scripts other than the dictionary contain no Japanese outside comments', () => {
  for (const file of fs.readdirSync(path.join(root, 'js'))) {
    if (file === 'i18n.js') continue;
    const src = fs.readFileSync(path.join(root, 'js', file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert.doesNotMatch(src, JAPANESE, file);
  }
});

test('t() fills placeholders and rejects unknown keys', () => {
  assert.equal(I18n.t('ch.unlock', { level: 'X' }), I18n.ja['ch.unlock'].replace('{level}', 'X'));
  assert.throws(() => I18n.t('no.such.key'));
});
