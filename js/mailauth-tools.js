// Record checker and Authentication-Results reader (pure, no DOM, no network).
// Findings are { level: 'error' | 'warning' | 'info', key, values } so the UI can translate them.
const MailAuthTools = (() => {
  const Core = typeof MailAuthCore !== 'undefined' ? MailAuthCore : require('./mailauth-core.js');
  const DNS_TERMS = ['include', 'a', 'mx', 'ptr', 'exists'];
  const KNOWN_MECHANISMS = ['all', 'ip4', 'ip6', ...DNS_TERMS];
  const LOOKUP_LIMIT = 10;                  // RFC 7208 section 4.6.4
  const DMARC_TAGS = ['v', 'p', 'sp', 'adkim', 'aspf', 'pct', 'rua', 'ruf', 'fo', 'rf', 'ri', 'np', 'psd', 't'];

  const finding = (level, key, values = {}) => ({ level, key, values });

  // ---------- SPF record ----------
  function lintSpf(record) {
    const text = String(record || '').trim();
    const out = [];
    if (text === '') return [finding('error', 'lint.spf.empty')];
    if ((text.match(/(^|\s)v=spf1(\s|$)/gi) || []).length > 1) out.push(finding('error', 'lint.spf.multiple'));
    const terms = text.split(/\s+/);
    if (terms[0].toLowerCase() !== 'v=spf1') return [...out, finding('error', 'lint.spf.version')];
    let lookups = 0, allIndex = -1, allQualifier = null;
    const modifiers = {};
    terms.slice(1).forEach((term, i) => {
      const mod = /^([a-z][a-z0-9_.-]*)=(.*)$/i.exec(term);
      if (mod) {
        const name = mod[1].toLowerCase();
        if (name === 'v') return;          // a second record is already reported above
        modifiers[name] = (modifiers[name] || 0) + 1;
        if (modifiers[name] === 2 && ['redirect', 'exp'].includes(name)) out.push(finding('error', 'lint.spf.duplicateModifier', { name }));
        if (name === 'redirect') lookups += 1;
        return;
      }
      const qualifier = '+-~?'.includes(term[0]) ? term[0] : '+';
      const body = '+-~?'.includes(term[0]) ? term.slice(1) : term;
      const [rawName, value] = body.split(/:(.*)/s);
      const name = rawName.split('/')[0].toLowerCase();
      if (!KNOWN_MECHANISMS.includes(name)) return out.push(finding('error', 'lint.spf.unknown', { term }));
      if (allIndex >= 0) out.push(finding('warning', 'lint.spf.afterAll', { term }));
      if (name === 'all') { allIndex = i; allQualifier = qualifier; return; }
      if (name === 'ip4' || name === 'ip6') {
        if (!Core.parseNetwork(value, name === 'ip4' ? 4 : 6)) out.push(finding('error', 'lint.spf.badAddress', { term }));
        return;
      }
      lookups += 1;
      if (name === 'ptr') out.push(finding('warning', 'lint.spf.ptr'));
      if (['include', 'exists'].includes(name) && !value) out.push(finding('error', 'lint.spf.missingDomain', { term }));
    });
    if (lookups > LOOKUP_LIMIT) out.push(finding('error', 'lint.spf.tooManyLookups', { count: lookups, limit: LOOKUP_LIMIT }));
    else if (lookups > 0) out.push(finding('info', 'lint.spf.lookups', { count: lookups, limit: LOOKUP_LIMIT }));
    if (allIndex < 0 && !modifiers.redirect) out.push(finding('warning', 'lint.spf.noAll'));
    if (allQualifier === '+') out.push(finding('error', 'lint.spf.plusAll'));
    if (allQualifier === '?') out.push(finding('warning', 'lint.spf.neutralAll'));
    if (allQualifier === '~') out.push(finding('info', 'lint.spf.softAll'));
    if (allQualifier === '-') out.push(finding('info', 'lint.spf.hardAll'));
    if (allIndex >= 0 && modifiers.redirect) out.push(finding('warning', 'lint.spf.redirectIgnored'));
    if (text.length > 255) out.push(finding('info', 'lint.spf.long', { length: text.length }));
    return out;
  }

  // ---------- DMARC record ----------
  function lintDmarc(record) {
    const text = String(record || '').trim();
    if (text === '') return [finding('error', 'lint.dmarc.empty')];
    const out = [];
    const pairs = text.split(';').map(s => s.trim()).filter(Boolean);
    const tags = {};
    pairs.forEach((pair, i) => {
      const eq = pair.indexOf('=');
      if (eq < 1) return out.push(finding('error', 'lint.dmarc.syntax', { part: pair }));
      const name = pair.slice(0, eq).trim().toLowerCase(), value = pair.slice(eq + 1).trim();
      if (name in tags) out.push(finding('error', 'lint.dmarc.duplicate', { name }));
      tags[name] = value;
      if (i === 0 && name !== 'v') out.push(finding('error', 'lint.dmarc.versionFirst'));
      if (!DMARC_TAGS.includes(name)) out.push(finding('warning', 'lint.dmarc.unknownTag', { name }));
    });
    if (tags.v !== 'DMARC1') out.push(finding('error', 'lint.dmarc.version'));
    const policy = v => ['none', 'quarantine', 'reject'].includes(String(v).toLowerCase());
    if (tags.p === undefined) out.push(finding('error', 'lint.dmarc.noPolicy'));
    else if (!policy(tags.p)) out.push(finding('error', 'lint.dmarc.badPolicy', { tag: 'p', value: tags.p }));
    if (tags.sp !== undefined && !policy(tags.sp)) out.push(finding('error', 'lint.dmarc.badPolicy', { tag: 'sp', value: tags.sp }));
    for (const tag of ['adkim', 'aspf']) {
      if (tags[tag] !== undefined && !['r', 's'].includes(tags[tag].toLowerCase())) out.push(finding('error', 'lint.dmarc.badMode', { tag, value: tags[tag] }));
    }
    for (const tag of ['rua', 'ruf']) {
      if (tags[tag] === undefined) continue;
      for (const uri of tags[tag].split(',').map(s => s.trim())) {
        if (!/^mailto:[^@\s]+@[^@\s]+$/i.test(uri.replace(/!\d+[kmgt]?$/i, ''))) out.push(finding('error', 'lint.dmarc.badUri', { tag, value: uri }));
      }
    }
    if (tags.pct !== undefined) {
      if (!/^\d{1,3}$/.test(tags.pct) || Number(tags.pct) > 100) out.push(finding('error', 'lint.dmarc.badPct', { value: tags.pct }));
      else if (Number(tags.pct) < 100) out.push(finding('info', 'lint.dmarc.partialPct', { value: tags.pct }));
    }
    const p = String(tags.p || '').toLowerCase();
    if (p === 'none') out.push(finding('info', 'lint.dmarc.monitor'));
    if (p === 'reject') out.push(finding('info', 'lint.dmarc.reject'));
    if (policy(tags.p) && tags.sp === undefined) out.push(finding('info', 'lint.dmarc.noSp', { p }));
    if (tags.rua === undefined) out.push(finding('warning', 'lint.dmarc.noRua'));
    return out;
  }

  function worst(findings) {
    return findings.some(f => f.level === 'error') ? 'error' : findings.some(f => f.level === 'warning') ? 'warning' : 'ok';
  }

  // ---------- Authentication-Results (RFC 8601, simplified) ----------
  // Joins folded lines and returns the values of every Authentication-Results header, top first.
  function extractAuthResults(headers) {
    const lines = String(headers || '').replace(/\r\n?/g, '\n').split('\n');
    const unfolded = [];
    for (const line of lines) {
      if (/^[ \t]/.test(line) && unfolded.length) unfolded[unfolded.length - 1] += ' ' + line.trim();
      else unfolded.push(line);
    }
    return unfolded.filter(l => /^authentication-results\s*:/i.test(l)).map(l => l.replace(/^[^:]*:\s*/, ''));
  }

  function stripComments(text) {
    let out = '', depth = 0, quoted = false;
    for (const ch of text) {
      if (ch === '"' && depth === 0) quoted = !quoted;
      if (!quoted && ch === '(') { depth += 1; continue; }
      if (!quoted && ch === ')' && depth > 0) { depth -= 1; continue; }
      if (depth === 0) out += ch;
    }
    return out;
  }

  function parseAuthResults(value) {
    const parts = stripComments(value).split(';').map(s => s.trim()).filter(Boolean);
    const authservId = (parts.shift() || '').split(/\s+/)[0];
    const results = [];
    for (const part of parts) {
      const m = /^([a-z][a-z0-9-]*)\s*=\s*([a-z]+)\b(.*)$/i.exec(part);
      if (!m) continue;
      const props = {};
      for (const [, k, v] of m[3].matchAll(/([a-z][a-z0-9-]*\.[a-z0-9._-]+)\s*=\s*("[^"]*"|[^\s;]+)/gi)) props[k.toLowerCase()] = v.replace(/^"|"$/g, '');
      const reason = /reason\s*=\s*("[^"]*"|\S+)/i.exec(m[3]);
      results.push({ method: m[1].toLowerCase(), result: m[2].toLowerCase(), props, reason: reason ? reason[1].replace(/^"|"$/g, '') : null });
    }
    return { authservId, results };
  }

  // Domain part of an address or a bare domain
  function domainOf(value) {
    if (!value) return null;
    const at = String(value).lastIndexOf('@');
    return Core.normalizeDomain(at >= 0 ? String(value).slice(at + 1) : value);
  }

  // Summary of one header: results by method and relaxed alignment with header.from
  function explain(parsed) {
    const pick = method => parsed.results.find(r => r.method === method) || null;
    const spf = pick('spf'), dkims = parsed.results.filter(r => r.method === 'dkim'), dmarc = pick('dmarc');
    const from = domainOf(dmarc && dmarc.props['header.from']) || domainOf(parsed.results.map(r => r.props['header.from']).find(Boolean));
    const spfDomain = spf ? domainOf(spf.props['smtp.mailfrom'] || spf.props['smtp.helo']) : null;
    const align = (domain, passed) => (from && domain && passed ? Core.aligned(domain, from, 'r') : null);
    return {
      authservId: parsed.authservId,
      from,
      spf: spf && { result: spf.result, domain: spfDomain, aligned: align(spfDomain, spf.result === 'pass') },
      dkim: dkims.map(d => ({ result: d.result, domain: domainOf(d.props['header.d'] || d.props['header.i']),
        aligned: align(domainOf(d.props['header.d'] || d.props['header.i']), d.result === 'pass') })),
      dmarc: dmarc && { result: dmarc.result },
      others: parsed.results.filter(r => !['spf', 'dkim', 'dmarc'].includes(r.method)).map(r => ({ method: r.method, result: r.result }))
    };
  }

  function readHeaders(headers) {
    return extractAuthResults(headers).map(v => explain(parseAuthResults(v)));
  }

  return { LOOKUP_LIMIT, lintSpf, lintDmarc, worst, extractAuthResults, stripComments, parseAuthResults, domainOf, explain, readHeaders };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = MailAuthTools;
