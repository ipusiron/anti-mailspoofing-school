// Scenario and question data. Every domain and address comes from the ranges reserved for
// documentation (RFC 2606 / RFC 5737 / RFC 3849). Texts live in js/i18n.js under the ids below.
// The correct answer of each question is computed by MailAuthCore; `expected` is checked by the tests.
const MailAuthData = (() => {
  const OWN_SPF = 'v=spf1 ip4:192.0.2.0/24 -all';

  // Simulation presets (the "custom" entry leaves the form empty)
  const SCENARIOS = [
    { id: 'normal', msg: { fromDomain: 'example.com', mailFromDomain: 'example.com', senderIp: '192.0.2.1', spfRecord: OWN_SPF,
      dkimResult: 'pass', dkimDomain: 'example.com', dmarcRecord: 'v=DMARC1; p=reject' } },
    { id: 'spoof', msg: { fromDomain: 'example.com', mailFromDomain: 'example.com', senderIp: '203.0.113.5', spfRecord: OWN_SPF,
      dkimResult: 'none', dkimDomain: '', dmarcRecord: 'v=DMARC1; p=reject' } },
    { id: 'unaligned', msg: { fromDomain: 'example.com', mailFromDomain: 'mail.example.net', senderIp: '203.0.113.5',
      spfRecord: 'v=spf1 ip4:203.0.113.0/24 -all', dkimResult: 'none', dkimDomain: '', dmarcRecord: 'v=DMARC1; p=reject' } },
    { id: 'dkim-fail', msg: { fromDomain: 'example.com', mailFromDomain: 'example.com', senderIp: '192.0.2.1', spfRecord: OWN_SPF,
      dkimResult: 'fail', dkimDomain: 'example.com', dmarcRecord: 'v=DMARC1; p=quarantine' } },
    { id: 'monitor', msg: { fromDomain: 'example.com', mailFromDomain: 'example.com', senderIp: '203.0.113.5', spfRecord: OWN_SPF,
      dkimResult: 'fail', dkimDomain: 'example.com', dmarcRecord: 'v=DMARC1; p=none' } },
    { id: 'forwarded', msg: { fromDomain: 'example.com', mailFromDomain: 'example.com', senderIp: '198.51.100.20', spfRecord: OWN_SPF,
      dkimResult: 'pass', dkimDomain: 'example.com', dmarcRecord: 'v=DMARC1; p=reject' } },
    { id: 'esp', msg: { fromDomain: 'example.com', mailFromDomain: 'bounce.example.org', senderIp: '198.51.100.7',
      spfRecord: 'v=spf1 ip4:198.51.100.0/24 -all', dkimResult: 'pass', dkimDomain: 'example.com', dmarcRecord: 'v=DMARC1; p=reject' } },
    { id: 'strict', msg: { fromDomain: 'example.com', mailFromDomain: 'bounce.example.com', senderIp: '192.0.2.1', spfRecord: OWN_SPF,
      dkimResult: 'none', dkimDomain: '', dmarcRecord: 'v=DMARC1; p=reject; aspf=s' } },
    { id: 'subdomain', msg: { fromDomain: 'news.example.com', mailFromDomain: 'news.example.com', senderIp: '203.0.113.9', spfRecord: OWN_SPF,
      dkimResult: 'fail', dkimDomain: 'news.example.com', dmarcRecord: 'v=DMARC1; p=reject; sp=quarantine' } },
    { id: 'substring', msg: { fromDomain: 'example.com', mailFromDomain: 'example.com', senderIp: '192.0.2.1',
      spfRecord: 'v=spf1 ip4:192.0.2.10 -all', dkimResult: 'none', dkimDomain: '', dmarcRecord: 'v=DMARC1; p=quarantine' } }
  ];

  // Challenge questions: 4 per level. `expected` must equal MailAuthCore.evaluateMessage(msg).action
  const QUESTIONS = [
    { id: 'q1', level: 1, expected: 'reject', msg: SCENARIOS[1].msg },
    { id: 'q2', level: 1, expected: 'accept', msg: SCENARIOS[0].msg },
    { id: 'q3', level: 1, expected: 'accept', msg: SCENARIOS[4].msg },
    { id: 'q4', level: 1, expected: 'quarantine', msg: { ...SCENARIOS[4].msg, dmarcRecord: 'v=DMARC1; p=quarantine' } },
    { id: 'q5', level: 2, expected: 'accept', msg: { ...SCENARIOS[5].msg, dmarcRecord: 'v=DMARC1; p=quarantine' } },
    { id: 'q6', level: 2, expected: 'quarantine', msg: { fromDomain: 'example.com', mailFromDomain: 'example.com', senderIp: '203.0.113.5',
      spfRecord: 'v=spf1 ip4:192.0.2.0/24 ~all', dkimResult: 'fail', dkimDomain: 'example.com', dmarcRecord: 'v=DMARC1; p=quarantine' } },
    { id: 'q7', level: 2, expected: 'reject', msg: SCENARIOS[2].msg },
    { id: 'q8', level: 2, expected: 'accept', msg: SCENARIOS[6].msg },
    { id: 'q9', level: 3, expected: 'accept', msg: { ...SCENARIOS[5].msg, dmarcRecord: 'v=DMARC1; p=reject; adkim=s' } },
    { id: 'q10', level: 3, expected: 'reject', msg: SCENARIOS[7].msg },
    { id: 'q11', level: 3, expected: 'quarantine', msg: SCENARIOS[8].msg },
    { id: 'q12', level: 3, expected: 'accept', msg: { fromDomain: 'example.com', mailFromDomain: 'example.com', senderIp: '192.0.2.10',
      spfRecord: OWN_SPF, dkimResult: 'fail', dkimDomain: 'example.com', dmarcRecord: 'v=DMARC1; p=reject' } }
  ];

  // Record checker samples (Record checker tab)
  const LINT_SAMPLES = {
    good: { spf: 'v=spf1 ip4:192.0.2.0/24 include:_spf.example.net -all',
      dmarc: 'v=DMARC1; p=reject; sp=reject; adkim=r; aspf=r; rua=mailto:dmarc-reports@example.com' },
    bad: { spf: 'v=spf1 ip4:192.0.2.300 ptr mx include: +all ip4:198.51.100.0/24',
      dmarc: 'p=monitor; v=DMARC1; adkim=x; pct=50; rua=dmarc@example.com' }
  };

  // Header reader samples. In "spoof" the lower header was written by the sender, not by the receiver.
  const HEADER_SAMPLES = {
    pass: [
      'Authentication-Results: mx.example.net;',
      ' spf=pass (sender IP is 192.0.2.1) smtp.mailfrom=bounce.example.com;',
      ' dkim=pass header.d=example.com header.s=sel1;',
      ' dmarc=pass (p=reject) header.from=example.com',
      'Received: from mail.example.com (mail.example.com [192.0.2.1]) by mx.example.net',
      'From: Example Shop <info@example.com>',
      'Subject: Your order'
    ].join('\n'),
    spoof: [
      'Authentication-Results: mx.example.net;',
      ' spf=fail (sender IP is 203.0.113.5) smtp.mailfrom=example.com;',
      ' dkim=none;',
      ' dmarc=fail (p=reject) header.from=example.com',
      'Received: from unknown ([203.0.113.5]) by mx.example.net',
      'Authentication-Results: mx.example.org;',
      ' spf=pass smtp.mailfrom=example.com; dkim=pass header.d=example.com;',
      ' dmarc=pass header.from=example.com',
      'From: Example Bank <support@example.com>',
      'Subject: Please confirm your account'
    ].join('\n'),
    forward: [
      'Authentication-Results: mx.example.net;',
      ' spf=softfail (198.51.100.20 is not permitted) smtp.mailfrom=example.com;',
      ' dkim=pass header.d=example.com header.s=sel1;',
      ' arc=pass;',
      ' dmarc=pass (p=quarantine) header.from=example.com',
      'Received: from relay.example.org ([198.51.100.20]) by mx.example.net',
      'From: Example News <news@example.com>',
      'Subject: Weekly newsletter'
    ].join('\n')
  };

  return { SCENARIOS, QUESTIONS, LINT_SAMPLES, HEADER_SAMPLES };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = MailAuthData;
