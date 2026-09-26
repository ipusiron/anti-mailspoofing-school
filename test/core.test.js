const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/mailauth-core.js');

test('IPv4 and IPv6 parsing', () => {
  assert.deepEqual(C.parseIPv4('192.0.2.1'), [192, 0, 2, 1]);
  for (const bad of ['192.0.2', '192.0.2.256', '1.2.3.4.5', 'a.b.c.d', '']) assert.equal(C.parseIPv4(bad), null, bad);
  assert.deepEqual(C.parseIPv6('2001:db8::'), [0x2001, 0xdb8, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(C.parseIPv6('::ffff:192.0.2.1'), [0, 0, 0, 0, 0, 0xffff, 0xc000, 0x201]);
  assert.deepEqual(C.parseIPv6('1:2:3:4:5:6:7:8'), [1, 2, 3, 4, 5, 6, 7, 8]);
  for (const bad of ['1::2::3', '1:2:3:4:5:6:7:8:9', '12345::', 'g::1', '1:2:3:4:5:6:7']) assert.equal(C.parseIPv6(bad), null, bad);
});

test('SPF: exact and CIDR matching, never a substring match', () => {
  const r = (record, ip) => C.evaluateSpf(record, ip).result;
  assert.equal(r('v=spf1 ip4:192.0.2.10 -all', '192.0.2.1'), 'fail');       // the old substring bug gave pass
  assert.equal(r('v=spf1 ip4:192.0.2.1 -all', '192.0.2.10'), 'fail');
  assert.equal(r('v=spf1 ip4:192.0.2.1 -all', '192.0.2.1'), 'pass');
  assert.equal(r('v=spf1 ip4:192.0.2.0/24 -all', '192.0.2.254'), 'pass');
  assert.equal(r('v=spf1 ip4:192.0.2.0/25 -all', '192.0.2.200'), 'fail');
  assert.equal(r('v=spf1 ip6:2001:db8::/32 -all', '2001:db8:1::5'), 'pass');
  assert.equal(r('v=spf1 ip6:2001:db8::/32 -all', '2001:db9::5'), 'fail');
  assert.equal(r('v=spf1 ip4:192.0.2.0/24 -all', '2001:db8::1'), 'fail');
});

test('SPF qualifiers, missing records and errors', () => {
  const e = (record, ip = '203.0.113.5') => C.evaluateSpf(record, ip);
  assert.equal(e('v=spf1 ip4:192.0.2.0/24 ~all').result, 'softfail');
  assert.equal(e('v=spf1 ip4:192.0.2.0/24 ?all').result, 'neutral');
  assert.equal(e('v=spf1 +all').result, 'pass');
  assert.equal(e('v=spf1 ip4:192.0.2.0/24').result, 'neutral');
  assert.equal(e('').result, 'none');
  assert.equal(e('spf1 -all').result, 'permerror');
  assert.equal(e('v=spf1 ip4:192.0.2.300 -all').error, 'ip4:192.0.2.300');
  assert.equal(e('v=spf1 bogus -all').result, 'permerror');
  assert.equal(e('v=spf1 -all', 'not-an-ip').error, 'senderIp');
  const inc = e('v=spf1 include:_spf.example.net a mx ~all');
  assert.equal(inc.result, 'softfail');
  assert.deepEqual(inc.notEvaluated, ['include:_spf.example.net', 'a', 'mx']);
  assert.deepEqual(e('v=spf1 redirect=_spf.example.net').notEvaluated, ['redirect=_spf.example.net']);
});

test('organizational domain and alignment', () => {
  assert.equal(C.organizationalDomain('a.b.example.com'), 'example.com');
  assert.equal(C.organizationalDomain('mail.example.co.jp'), 'example.co.jp');
  assert.equal(C.organizationalDomain('Example.COM.'), 'example.com');
  assert.equal(C.organizationalDomain('bad_domain'), null);
  assert.equal(C.aligned('bounce.example.com', 'example.com', 'r'), true);
  assert.equal(C.aligned('bounce.example.com', 'example.com', 's'), false);
  assert.equal(C.aligned('example.com', 'EXAMPLE.com', 's'), true);
  assert.equal(C.aligned('example.net', 'example.com', 'r'), false);
  assert.equal(C.aligned('example.co.jp', 'other.co.jp', 'r'), false);
});

test('DMARC record parsing', () => {
  assert.deepEqual(C.parseDmarc('v=DMARC1; p=reject'), { valid: true, p: 'reject', sp: 'reject', adkim: 'r', aspf: 'r', explicitSp: false });
  assert.deepEqual(C.parseDmarc('v=DMARC1; p=none; sp=quarantine; adkim=s; aspf=s'),
    { valid: true, p: 'none', sp: 'quarantine', adkim: 's', aspf: 's', explicitSp: true });
  for (const [record, error] of [['', 'empty'], ['v=DMARC2; p=none', 'version'], ['v=DMARC1; p=block', 'p'],
    ['v=DMARC1; p=none; sp=x', 'sp'], ['v=DMARC1; p=none; adkim=x', 'adkim'], ['v=DMARC1; p=none; aspf=q', 'aspf']]) {
    assert.equal(C.parseDmarc(record).error, error, record);
  }
});

test('DMARC evaluation: alignment decides, softfail is not a pass, sp applies to subdomains', () => {
  const base = { fromDomain: 'example.com', mailFromDomain: 'example.com', spfResult: 'fail', dkimResult: 'none', dkimDomain: '',
    dmarcRecord: 'v=DMARC1; p=reject; sp=quarantine' };
  assert.equal(C.evaluateDmarc({ ...base, spfResult: 'pass' }).result, 'pass');
  assert.equal(C.evaluateDmarc({ ...base, spfResult: 'softfail' }).result, 'fail');
  assert.equal(C.evaluateDmarc({ ...base, spfResult: 'pass', mailFromDomain: 'example.net' }).result, 'fail');
  assert.equal(C.evaluateDmarc({ ...base, dkimResult: 'pass', dkimDomain: 'mail.example.com' }).result, 'pass');
  assert.equal(C.evaluateDmarc({ ...base, dkimResult: 'fail', dkimDomain: 'example.com' }).result, 'fail');
  const sub = C.evaluateDmarc({ ...base, fromDomain: 'news.example.com', mailFromDomain: 'news.example.com' });
  assert.equal(sub.policyTag, 'sp');
  assert.equal(C.action(sub), 'quarantine');
  assert.equal(C.action(C.evaluateDmarc({ ...base, dmarcRecord: 'v=DMARC1; p=none' })), 'accept');
  assert.equal(C.evaluateDmarc({ ...base, dmarcRecord: 'nonsense' }).result, 'none');
  assert.equal(C.evaluateDmarc({ ...base, fromDomain: '' }).result, 'permerror');
});
