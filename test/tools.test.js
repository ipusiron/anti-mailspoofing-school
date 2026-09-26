const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../js/mailauth-tools.js');
const D = require('../js/mailauth-data.js');
const I18n = require('../js/i18n.js');

const keys = findings => findings.map(f => f.key.split('.').pop());
const levelOf = (findings, name) => (findings.find(f => f.key.endsWith('.' + name)) || {}).level;

test('SPF lint: safe records have no errors', () => {
  const findings = T.lintSpf('v=spf1 ip4:192.0.2.0/24 ip6:2001:db8::/32 include:_spf.example.net -all');
  assert.equal(T.worst(findings), 'ok');
  assert.deepEqual(keys(findings), ['lookups', 'hardAll']);
  assert.deepEqual(findings[0].values, { count: 1, limit: 10 });
});

test('SPF lint: the qualifier of all', () => {
  assert.equal(levelOf(T.lintSpf('v=spf1 +all'), 'plusAll'), 'error');
  assert.equal(levelOf(T.lintSpf('v=spf1 all'), 'plusAll'), 'error');         // no qualifier means +
  assert.equal(levelOf(T.lintSpf('v=spf1 ?all'), 'neutralAll'), 'warning');
  assert.equal(levelOf(T.lintSpf('v=spf1 ~all'), 'softAll'), 'info');
  assert.equal(levelOf(T.lintSpf('v=spf1 ip4:192.0.2.1'), 'noAll'), 'warning');
  assert.ok(!keys(T.lintSpf('v=spf1 redirect=_spf.example.com')).includes('noAll'));
  assert.equal(levelOf(T.lintSpf('v=spf1 -all redirect=_spf.example.com'), 'redirectIgnored'), 'warning');
});

test('SPF lint: syntax errors', () => {
  assert.deepEqual(keys(T.lintSpf('')), ['empty']);
  assert.deepEqual(keys(T.lintSpf('spf1 -all')), ['version']);
  assert.deepEqual(keys(T.lintSpf('v=spf1 -all v=spf1 ~all')).slice(0, 1), ['multiple']);
  const bad = T.lintSpf('v=spf1 ip4:192.0.2.300 ip6:2001:db8::/129 include: exists: foo:bar -all');
  assert.deepEqual(bad.filter(f => f.key.endsWith('badAddress')).map(f => f.values.term), ['ip4:192.0.2.300', 'ip6:2001:db8::/129']);
  assert.deepEqual(bad.filter(f => f.key.endsWith('missingDomain')).map(f => f.values.term), ['include:', 'exists:']);
  assert.deepEqual(bad.find(f => f.key.endsWith('unknown')).values, { term: 'foo:bar' });
  assert.deepEqual(keys(T.lintSpf('v=spf1 -all ip4:192.0.2.1')).slice(0, 1), ['afterAll']);
  assert.equal(levelOf(T.lintSpf('v=spf1 redirect=a.example.com redirect=b.example.com'), 'duplicateModifier'), 'error');
  assert.equal(levelOf(T.lintSpf('v=spf1 ptr -all'), 'ptr'), 'warning');
});

test('SPF lint: DNS lookup limit (10)', () => {
  const record = n => 'v=spf1 ' + Array.from({ length: n }, (_, i) => `include:s${i}.example.com`).join(' ') + ' -all';
  assert.equal(levelOf(T.lintSpf(record(10)), 'lookups'), 'info');
  assert.deepEqual(T.lintSpf(record(11)).find(f => f.key.endsWith('tooManyLookups')).values, { count: 11, limit: 10 });
  // a, mx, ptr, exists and redirect count; ip4, ip6 and all do not
  assert.equal(T.lintSpf('v=spf1 a mx ptr exists:x.example.com ip4:192.0.2.1 ip6:2001:db8::1 redirect=r.example.com')
    .find(f => f.key.endsWith('lookups')).values.count, 5);
  assert.equal(levelOf(T.lintSpf('v=spf1 ' + 'ip4:192.0.2.1 '.repeat(20) + '-all'), 'long'), 'info');
});

test('DMARC lint', () => {
  assert.deepEqual(keys(T.lintDmarc('v=DMARC1; p=reject; sp=reject; rua=mailto:r@example.com')), ['reject']);
  assert.deepEqual(keys(T.lintDmarc('v=DMARC1; p=none')), ['monitor', 'noSp', 'noRua']);
  assert.deepEqual(keys(T.lintDmarc('')), ['empty']);
  assert.deepEqual(keys(T.lintDmarc('p=none; v=DMARC1; rua=mailto:r@example.com')).slice(0, 1), ['versionFirst']);
  assert.ok(keys(T.lintDmarc('v=DMARC2; p=none')).includes('version'));
  assert.ok(keys(T.lintDmarc('v=DMARC1; rua=mailto:r@example.com')).includes('noPolicy'));
  const bad = T.lintDmarc('v=DMARC1; p=block; sp=maybe; adkim=x; aspf=y; pct=150; rua=r@example.com; foo=1');
  assert.deepEqual(bad.filter(f => f.key.endsWith('badPolicy')).map(f => f.values.tag), ['p', 'sp']);
  assert.deepEqual(bad.filter(f => f.key.endsWith('badMode')).map(f => f.values.tag), ['adkim', 'aspf']);
  assert.deepEqual(['badPct', 'badUri', 'unknownTag'].map(name => levelOf(bad, name)), ['error', 'error', 'warning']);
  assert.equal(levelOf(T.lintDmarc('v=DMARC1; p=none; p=reject'), 'duplicate'), 'error');
  assert.equal(levelOf(T.lintDmarc('v=DMARC1; p=reject; pct=50; rua=mailto:r@example.com'), 'partialPct'), 'info');
  assert.ok(!keys(T.lintDmarc('v=DMARC1; p=reject; rua=mailto:a@example.com!10m,mailto:b@example.net')).includes('badUri'));
  assert.ok(keys(T.lintDmarc('v=DMARC1; p=reject; rua=mailto:r@example.com; oops')).includes('syntax'));
});

test('every finding key has a message in both languages', () => {
  const inputs = ['', 'x', 'v=spf1 -all v=spf1', 'v=spf1 foo ip4:1 include: ptr redirect=a redirect=b +all a', 'v=spf1 ?all', 'v=spf1 ~all',
    'v=spf1 a', 'v=spf1 ' + 'a '.repeat(11) + '-all', 'v=spf1 ' + 'ip4:192.0.2.1 '.repeat(20) + '-all', 'v=spf1 -all redirect=a'];
  const dmarc = ['', 'x', 'p=none; v=DMARC1; p=reject; foo=1; sp=x; adkim=x; pct=50; rua=x', 'v=DMARC1; p=reject; pct=500', 'v=DMARC1', 'v=DMARC1; p=none'];
  const all = new Set([...inputs.flatMap(r => T.lintSpf(r)), ...dmarc.flatMap(r => T.lintDmarc(r))].map(f => f.key));
  assert.ok(all.size >= 30, String(all.size));
  const inDictionary = Object.keys(I18n.ja).filter(k => k.startsWith('lint.'));
  for (const key of all) assert.ok(Object.hasOwn(I18n.ja, key) && Object.hasOwn(I18n.en, key), key);
  for (const key of inDictionary) assert.ok(all.has(key), `unused ${key}`);
});

test('Authentication-Results: unfolding, comments and properties', () => {
  const headers = 'Received: x\r\nAuthentication-Results: mx.example.net;\r\n\tspf=pass (ok; really) smtp.mailfrom=a@bounce.example.com;\r\n' +
    ' dkim=pass reason="good sig" header.d=example.com header.s=s1;\r\n dmarc=pass header.from=example.com\r\nSubject: hi';
  const values = T.extractAuthResults(headers);
  assert.equal(values.length, 1);
  const parsed = T.parseAuthResults(values[0]);
  assert.equal(parsed.authservId, 'mx.example.net');
  assert.deepEqual(parsed.results.map(r => [r.method, r.result]), [['spf', 'pass'], ['dkim', 'pass'], ['dmarc', 'pass']]);
  assert.equal(parsed.results[0].props['smtp.mailfrom'], 'a@bounce.example.com');
  assert.equal(parsed.results[1].reason, 'good sig');
  assert.equal(T.stripComments('a (b (c) d) e "(kept)"'), 'a  e "(kept)"');
  assert.equal(T.domainOf('User@Mail.Example.COM'), 'mail.example.com');
  assert.equal(T.domainOf(''), null);
  assert.deepEqual(T.readHeaders('Subject: none'), []);
});

test('Authentication-Results: relaxed alignment with header.from', () => {
  const read = v => T.explain(T.parseAuthResults(v));
  const r = read('mx.example.net; spf=pass smtp.mailfrom=mail.example.net; dkim=pass header.d=example.org; dmarc=fail header.from=example.com');
  assert.equal(r.from, 'example.com');
  assert.deepEqual(r.spf, { result: 'pass', domain: 'mail.example.net', aligned: false });
  assert.deepEqual(r.dkim, [{ result: 'pass', domain: 'example.org', aligned: false }]);
  const ok = read('mx.example.net; spf=pass smtp.mailfrom=bounce.example.com; dkim=fail header.d=example.com; dmarc=pass header.from=example.com');
  assert.equal(ok.spf.aligned, true);
  assert.equal(ok.dkim[0].aligned, null, 'alignment is shown only for a pass');
  assert.equal(read('mx.example.net; none').spf, null);
  assert.deepEqual(read('mx.example.net; arc=pass; spf=none smtp.helo=mail.example.com').others, [{ method: 'arc', result: 'pass' }]);
});

test('samples: expected findings and documentation-only names', () => {
  assert.equal(T.worst(T.lintSpf(D.LINT_SAMPLES.good.spf)), 'ok');
  assert.equal(T.worst(T.lintDmarc(D.LINT_SAMPLES.good.dmarc)), 'ok');
  assert.equal(T.worst(T.lintSpf(D.LINT_SAMPLES.bad.spf)), 'error');
  assert.equal(T.worst(T.lintDmarc(D.LINT_SAMPLES.bad.dmarc)), 'error');
  const [top, forged] = T.readHeaders(D.HEADER_SAMPLES.spoof);
  assert.deepEqual([top.authservId, top.dmarc.result, forged.authservId, forged.dmarc.result], ['mx.example.net', 'fail', 'mx.example.org', 'pass']);
  assert.equal(T.readHeaders(D.HEADER_SAMPLES.pass)[0].spf.aligned, true);
  const fwd = T.readHeaders(D.HEADER_SAMPLES.forward)[0];
  assert.deepEqual([fwd.spf.result, fwd.dkim[0].aligned, fwd.dmarc.result], ['softfail', true, 'pass']);
  const text = JSON.stringify([D.LINT_SAMPLES, D.HEADER_SAMPLES]);
  for (const [domain] of text.matchAll(/[a-z0-9-]+(\.[a-z0-9-]+)*\.(com|net|org)\b/gi)) assert.match(domain, /(^|\.)example\.(com|net|org)$/, domain);
  for (const [ip] of text.matchAll(/\b\d+\.\d+\.\d+\.\d+\b/g)) assert.match(ip, /^(192\.0\.2|198\.51\.100|203\.0\.113)\./, ip);
});
