// Pure SPF / DMARC evaluation used by every tab (no DOM, no network).
// Simplified for teaching: only mechanisms that need no DNS lookup are evaluated.
const MailAuthCore = (() => {
  // ---------- IP addresses ----------
  function parseIPv4(text) {
    const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(String(text).trim());
    if (!m) return null;
    const parts = m.slice(1).map(Number);
    if (parts.some(n => n > 255)) return null;
    return parts;
  }

  // Returns eight 16-bit groups, or null. Supports "::" and an embedded IPv4 tail.
  function parseIPv6(text) {
    let s = String(text).trim().toLowerCase();
    if (!/^[0-9a-f:.]+$/.test(s) || s.split('::').length > 2) return null;
    let tail = [];
    const v4 = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(s);
    if (v4) {
      const p = parseIPv4(v4[1]);
      if (!p) return null;
      tail = [(p[0] << 8) | p[1], (p[2] << 8) | p[3]];
      s = s.slice(0, -v4[1].length);
      if (s.endsWith(':') && !s.endsWith('::')) s = s.slice(0, -1);
    }
    const [head, rest] = s.includes('::') ? s.split('::') : [s, null];
    const toGroups = part => (part === '' ? [] : part.split(':'));
    const a = toGroups(head), b = rest === null ? [] : toGroups(rest);
    if ([...a, ...b].some(g => !/^[0-9a-f]{1,4}$/.test(g))) return null;
    const missing = 8 - tail.length - a.length - b.length;
    if (rest === null ? missing !== 0 : missing < 1) return null;
    return [...a, ...Array(rest === null ? 0 : missing).fill('0'), ...b].map(g => parseInt(g, 16)).concat(tail);
  }

  function parseIP(text) {
    const v4 = parseIPv4(text);
    if (v4) return { family: 4, bytes: v4 };
    const v6 = parseIPv6(text);
    if (v6) return { family: 6, bytes: v6.flatMap(g => [g >> 8, g & 255]) };
    return null;
  }

  // "192.0.2.0/24" or "2001:db8::/32" -> { family, bytes, prefix } or null
  function parseNetwork(text, family) {
    const [addr, len, extra] = String(text).split('/');
    if (extra !== undefined) return null;
    const ip = parseIP(addr);
    if (!ip || ip.family !== family) return null;
    const max = family === 4 ? 32 : 128;
    if (len !== undefined && !/^\d{1,3}$/.test(len)) return null;
    const prefix = len === undefined ? max : Number(len);
    if (prefix > max) return null;
    return { family, bytes: ip.bytes, prefix };
  }

  function inNetwork(ip, net) {
    if (!ip || !net || ip.family !== net.family) return false;
    for (let bit = 0; bit < net.prefix; bit++) {
      const i = bit >> 3, mask = 0x80 >> (bit & 7);
      if ((ip.bytes[i] & mask) !== (net.bytes[i] & mask)) return false;
    }
    return true;
  }

  // ---------- SPF (RFC 7208, without DNS lookups) ----------
  const QUALIFIERS = { '+': 'pass', '-': 'fail', '~': 'softfail', '?': 'neutral' };
  const DNS_MECHANISMS = ['a', 'mx', 'include', 'exists', 'ptr'];

  // Result: { result, matched, notEvaluated: [terms], error }
  // result is one of pass / fail / softfail / neutral / none / permerror
  function evaluateSpf(record, senderIp) {
    const text = String(record || '').trim();
    if (text === '') return { result: 'none', matched: null, notEvaluated: [], error: null };
    const terms = text.split(/\s+/);
    if (terms[0].toLowerCase() !== 'v=spf1') return { result: 'permerror', matched: null, notEvaluated: [], error: 'version' };
    const ip = parseIP(senderIp);
    if (!ip) return { result: 'permerror', matched: null, notEvaluated: [], error: 'senderIp' };
    const notEvaluated = [];
    for (const term of terms.slice(1)) {
      if (/^[a-z][a-z0-9_.-]*=/i.test(term)) {           // modifiers such as redirect= and exp=
        if (/^redirect=/i.test(term)) notEvaluated.push(term);
        continue;
      }
      const q = QUALIFIERS[term[0]] ? term[0] : '+';
      const body = QUALIFIERS[term[0]] ? term.slice(1) : term;
      const [name, value] = body.split(/:(.*)/s);
      const mech = name.toLowerCase();
      if (mech === 'all') {
        if (value !== undefined) return { result: 'permerror', matched: null, notEvaluated, error: term };
        return { result: QUALIFIERS[q], matched: term, notEvaluated, error: null };
      }
      if (mech === 'ip4' || mech === 'ip6') {
        const net = parseNetwork(value, mech === 'ip4' ? 4 : 6);
        if (!net) return { result: 'permerror', matched: null, notEvaluated, error: term };
        if (inNetwork(ip, net)) return { result: QUALIFIERS[q], matched: term, notEvaluated, error: null };
        continue;
      }
      if (DNS_MECHANISMS.includes(mech.split('/')[0])) { notEvaluated.push(term); continue; }
      return { result: 'permerror', matched: null, notEvaluated, error: term };
    }
    return { result: 'neutral', matched: null, notEvaluated, error: null };   // no match and no "all"
  }

  // ---------- Domains and alignment (RFC 7489 section 3.1) ----------
  // A short list of two-label public suffixes. Real receivers use the Public Suffix List.
  const TWO_LABEL_SUFFIXES = ['co.jp', 'ne.jp', 'or.jp', 'ac.jp', 'go.jp', 'ad.jp', 'ed.jp', 'gr.jp', 'lg.jp',
    'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'com.au', 'net.au', 'org.au', 'co.nz', 'com.br', 'com.cn', 'co.kr'];

  function normalizeDomain(domain) {
    const d = String(domain || '').trim().toLowerCase().replace(/\.$/, '');
    return /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]*[a-z0-9]$/.test(d) ? d : null;
  }

  function organizationalDomain(domain) {
    const d = normalizeDomain(domain);
    if (!d) return null;
    const labels = d.split('.');
    const keep = TWO_LABEL_SUFFIXES.includes(labels.slice(-2).join('.')) ? 3 : 2;
    return labels.slice(-keep).join('.');
  }

  // mode: 'r' (relaxed, same organizational domain) or 's' (strict, identical)
  function aligned(domain, fromDomain, mode) {
    const a = normalizeDomain(domain), b = normalizeDomain(fromDomain);
    if (!a || !b) return false;
    return mode === 's' ? a === b : organizationalDomain(a) === organizationalDomain(b);
  }

  // ---------- DMARC record and evaluation ----------
  const POLICIES = ['none', 'quarantine', 'reject'];

  function parseDmarc(record) {
    const text = String(record || '').trim();
    if (text === '') return { valid: false, error: 'empty' };
    const tags = {};
    for (const part of text.split(';')) {
      const s = part.trim();
      if (!s) continue;
      const i = s.indexOf('=');
      if (i < 1) return { valid: false, error: s };
      tags[s.slice(0, i).trim().toLowerCase()] = s.slice(i + 1).trim();
    }
    if (tags.v !== 'DMARC1') return { valid: false, error: 'version' };
    const p = (tags.p || '').toLowerCase();
    if (!POLICIES.includes(p)) return { valid: false, error: 'p' };
    const sp = tags.sp === undefined ? p : tags.sp.toLowerCase();
    if (!POLICIES.includes(sp)) return { valid: false, error: 'sp' };
    const mode = v => (v === undefined ? 'r' : String(v).toLowerCase());
    const adkim = mode(tags.adkim), aspf = mode(tags.aspf);
    if (!['r', 's'].includes(adkim)) return { valid: false, error: 'adkim' };
    if (!['r', 's'].includes(aspf)) return { valid: false, error: 'aspf' };
    return { valid: true, p, sp, adkim, aspf, explicitSp: tags.sp !== undefined };
  }

  // input: { fromDomain, mailFromDomain, spfResult, dkimResult ('pass'|'fail'|'none'), dkimDomain, dmarcRecord }
  // The DMARC record is taken as published for the organizational domain of the From domain.
  function evaluateDmarc(input) {
    const record = parseDmarc(input.dmarcRecord);
    const from = normalizeDomain(input.fromDomain);
    if (!from) return { result: 'permerror', error: 'from' };
    if (!record.valid) return { result: 'none', error: record.error, disposition: 'none' };
    const spfAligned = input.spfResult === 'pass' && aligned(input.mailFromDomain, from, record.aspf);
    const dkimAligned = input.dkimResult === 'pass' && aligned(input.dkimDomain, from, record.adkim);
    const isSubdomain = from !== organizationalDomain(from);
    const policyTag = isSubdomain ? 'sp' : 'p';
    const policy = isSubdomain ? record.sp : record.p;
    const pass = spfAligned || dkimAligned;
    return {
      result: pass ? 'pass' : 'fail',
      spfAligned, dkimAligned, policyTag, policy,
      disposition: pass ? 'none' : policy,          // none means "deliver" (no action requested)
      record, error: null
    };
  }

  // The action a receiver following the policy would take: 'accept' | 'quarantine' | 'reject'
  function action(dmarc) {
    if (!dmarc || dmarc.result !== 'fail') return 'accept';
    return dmarc.disposition === 'none' ? 'accept' : dmarc.disposition;
  }

  // Full evaluation of one message
  function evaluateMessage(msg) {
    const spf = evaluateSpf(msg.spfRecord, msg.senderIp);
    const dmarc = evaluateDmarc({
      fromDomain: msg.fromDomain, mailFromDomain: msg.mailFromDomain, spfResult: spf.result,
      dkimResult: msg.dkimResult, dkimDomain: msg.dkimDomain, dmarcRecord: msg.dmarcRecord
    });
    return { spf, dkim: { result: msg.dkimResult, domain: normalizeDomain(msg.dkimDomain) }, dmarc, action: action(dmarc) };
  }

  return {
    parseIPv4, parseIPv6, parseIP, parseNetwork, inNetwork, evaluateSpf,
    TWO_LABEL_SUFFIXES, normalizeDomain, organizationalDomain, aligned,
    POLICIES, parseDmarc, evaluateDmarc, action, evaluateMessage
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = MailAuthCore;
