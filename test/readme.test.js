const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const C = require('../js/mailauth-core.js');
const D = require('../js/mailauth-data.js');
const T = require('../js/mailauth-tools.js');
const I = require('../js/i18n.js');
const root = path.join(__dirname, '..');
const readme = { ja: fs.readFileSync(path.join(root, 'README.md'), 'utf8'), en: fs.readFileSync(path.join(root, 'README.en.md'), 'utf8') };
const cells = line => line.split('|').slice(1, -1).map(c => c.trim().replace(/^`|`$/g, ''));

// Rows of the first table between `heading` and the next heading (header and separator removed)
function tableAfter(text, heading) {
  const start = text.indexOf(heading);
  assert.ok(start >= 0, heading);
  const lines = text.slice(start + heading.length).split('\n');
  const end = lines.findIndex(l => /^#{2,4} /.test(l));
  return lines.slice(0, end).filter(l => l.startsWith('|')).slice(2).map(cells);
}

test('SPF known answers match the core in both READMEs', () => {
  for (const [lang, heading] of [['ja', '### SPF の既知解答'], ['en', '### SPF known answers']]) {
    const rows = tableAfter(readme[lang], heading);
    assert.equal(rows.length, 8, lang);
    for (const [record, ip, result] of rows) {
      const r = record.startsWith('v=') ? record : '';
      assert.equal(C.evaluateSpf(r, ip).result, result, `${lang}: ${record} ${ip}`);
    }
    assert.deepEqual(rows[rows.length - 1].slice(0, 3), ['v=spf1 ip4:192.0.2.10 -all', '192.0.2.1', 'fail']);
  }
});

test('preset results match the core in both READMEs', () => {
  for (const [lang, heading] of [['ja', '### プリセットの判定'], ['en', '### Preset results']]) {
    const rows = tableAfter(readme[lang], heading);
    assert.equal(rows.length, D.SCENARIOS.length, lang);
    rows.forEach((row, i) => {
      const s = D.SCENARIOS[i];
      const r = C.evaluateMessage(s.msg);
      assert.ok(row[0].includes(s.id), `${lang} row ${i}`);
      assert.deepEqual([row[1], row[2], row[3]], [s.msg.fromDomain, s.msg.mailFromDomain, s.msg.senderIp]);
      assert.deepEqual([row[4], row[6], row[7], row[8]], [r.spf.result, s.msg.dmarcRecord, r.dmarc.result, r.action], `${lang} ${s.id}`);
    });
  }
});

test('record checker known answers match the tools in both READMEs', () => {
  const order = { error: 0, warning: 1, info: 2 };
  for (const [lang, heading] of [['ja', '### レコード診断の既知解答'], ['en', '### Record checker known answers']]) {
    const rows = tableAfter(readme[lang], heading);
    assert.equal(rows.length, 11, lang);
    for (const [kind, record, status, text] of rows) {
      const findings = (kind === 'SPF' ? T.lintSpf(record) : T.lintDmarc(record)).sort((a, b) => order[a.level] - order[b.level]);
      assert.equal(T.worst(findings), status, `${lang}: ${record}`);
      const expected = findings.map(f => I[lang][`level.${f.level}`] + ': ' +
        I[lang][f.key].replace(/\{(\w+)\}/g, (m, k) => (k in f.values ? String(f.values[k]) : m)));
      assert.deepEqual(text.split('<br>'), expected, `${lang}: ${record}`);
    }
    assert.ok(rows.some(r => r[2] === 'error') && rows.some(r => r[2] === 'warning') && rows.some(r => r[2] === 'ok'), lang);
  }
});

test('header reader known answers match the tools in both READMEs', () => {
  const expected = Object.keys(D.HEADER_SAMPLES).flatMap(id => T.readHeaders(D.HEADER_SAMPLES[id]).map((h, i) => ({ id, i, h })));
  const method = e => (e ? [e.result, e.domain || '', e.aligned === true ? '✓' : e.aligned === false ? '✗' : '—'] : null);
  const parse = cell => (cell === '—' ? null : /^`?([a-z]+)`?\s*(\S*?)\s*([✓✗—])$/.exec(cell).slice(1));
  for (const [lang, heading] of [['ja', '### ヘッダー解読の既知解答'], ['en', '### Header reader known answers']]) {
    const rows = tableAfter(readme[lang], heading);
    assert.equal(rows.length, expected.length, lang);
    rows.forEach((row, n) => {
      const { id, i, h } = expected[n];
      assert.ok(row[0].includes(id), `${lang} row ${n}`);
      assert.deepEqual([row[1], row[2]], [String(i + 1), h.authservId]);
      assert.deepEqual(parse(row[3]), method(h.spf), `${lang} ${id} spf`);
      assert.deepEqual(row[4].split('<br>').map(parse), h.dkim.length ? h.dkim.map(method) : [null], `${lang} ${id} dkim`);
      assert.equal(row[5], h.dmarc ? h.dmarc.result : '—');
    });
  }
});

test('YAML metadata keeps its structure', () => {
  const yaml = /^<!--\n---\n([\s\S]*?)\n---\n-->/.exec(readme.ja);
  assert.ok(yaml, 'YAML block');
  for (const line of ['id: day035', 'slug: anti-mailspoofing-school', 'repo_url: "https://github.com/ipusiron/anti-mailspoofing-school"',
    'demo_url: "https://ipusiron.github.io/anti-mailspoofing-school/"', 'hub: true']) assert.ok(yaml[1].includes(line), line);
  for (const key of ['category_ja:', 'category_en:', 'tags:']) {
    const lines = yaml[1].split('\n');
    assert.match(lines[lines.indexOf(key) + 1], /^ {2}- /, key);
  }
  assert.ok(!readme.en.includes('id: day035'), 'YAML only in README.md');
});

test('both READMEs have the same section structure', () => {
  const headings = t => t.split('\n').filter(l => /^#{2,4} /.test(l)).map(l => l.match(/^#+/)[0].length);
  assert.deepEqual(headings(readme.ja), headings(readme.en));
  assert.ok(headings(readme.ja).length >= 30);
  assert.match(readme.ja, /\[English\]\(README\.en\.md\) · 日本語/);
  assert.match(readme.en, /English · \[日本語\]\(README\.md\)/);
});

test('images exist and assets holds only referenced PNGs', () => {
  const refs = new Set();
  for (const text of Object.values(readme)) for (const [, p] of text.matchAll(/!\[[^\]]*\]\((assets\/[^)]+)\)/g)) refs.add(p);
  for (const p of refs) assert.ok(fs.existsSync(path.join(root, p)), p);
  const pngs = execFileSync('git', ['ls-files', 'assets'], { cwd: root, encoding: 'utf8' }).split('\n').filter(f => f.endsWith('.png'));
  for (const f of pngs) assert.ok(refs.has(f), `unreferenced ${f}`);
});

test('the directory tree lists every tracked file with a description', () => {
  const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean)
    .concat(['test/readme.test.js', 'test/tools.test.js', 'js/mailauth-tools.js', 'js/checker.js', 'js/headers.js', 'README.en.md',
      'assets/en/screenshot.png', 'assets/en/screenshot2.png', 'assets/screenshot2.png', 'assets/screenshot3.png']);
  for (const lang of ['ja', 'en']) {
    const block = readme[lang].slice(readme[lang].indexOf(lang === 'ja' ? '## 📁 ディレクトリー構造' : '## 📁 Directory Structure'));
    const tree = block.slice(block.indexOf('```') + 3, block.indexOf('```', block.indexOf('```') + 3));
    const lines = tree.split('\n').filter(l => l.trim() && !l.startsWith('anti-mailspoofing-school/'));
    for (const l of lines) assert.match(l, /# \S/, `${lang}: ${l}`);
    for (const f of new Set(tracked)) assert.ok(tree.includes(path.basename(f)), `${lang}: ${f}`);
  }
});

test('removed claims stay removed', () => {
  for (const bad of ['PWA準拠', 'Fortune 500', 'ROI', '1970年代', 'mailservice.com', '全て', 'Domain-based Message Authentication）']) {
    assert.ok(!readme.ja.includes(bad), bad);
  }
  assert.match(readme.ja, /Domain-based Message Authentication, Reporting and Conformance|RFC 7489/);
});

test('ユースケースの「このツールならではの使い方」を mailauth-core.js で再計算（日英）', () => {
  const C = require('../js/mailauth-core.js');
  assert.equal(C.evaluateSpf('v=spf1 ip4:192.0.2.0/24 -all', '192.0.2.10').result, 'pass');
  assert.equal(C.evaluateSpf('v=spf1 ip4:192.0.2.0/24 -all', '203.0.113.5').result, 'fail');
  const spoof = C.evaluateMessage({
    fromDomain: 'example.com', mailFromDomain: 'evil.com', senderIp: '203.0.113.5',
    spfRecord: 'v=spf1 ip4:203.0.113.0/24 -all', dkim: [], dmarcRecord: 'v=DMARC1; p=reject'
  });
  assert.equal(spoof.spf.result, 'pass');
  assert.equal(spoof.dmarc.spfAligned, false);
  assert.equal(spoof.dmarc.disposition, 'reject');
  assert.equal(C.organizationalDomain('mail.example.co.jp'), 'example.co.jp');
  for (const md of [readme.ja, readme.en]) {
    assert.ok(md.includes('192.0.2.0/24') && md.includes('mail.example.co.jp') && md.includes('example.co.jp'));
  }
});
