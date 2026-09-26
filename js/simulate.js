// Simulation tab: evaluates one message with MailAuthCore and shows each step.
document.addEventListener('DOMContentLoaded', () => {
  const STEP_DELAY_MS = 350;
  const $ = id => document.getElementById(id);
  const select = $('scenario-select');
  const description = $('scenario-description');
  const form = $('simulate-form');
  const formError = $('form-error');
  const progress = $('sim-progress');
  const dnsBox = $('dns-visualization');
  const stepsBox = $('verification-steps');
  const finalBox = $('final-result');
  const recBox = $('recommendations');
  const fields = {
    fromDomain: $('from-input'), mailFromDomain: $('mailfrom-input'), senderIp: $('ip-input'),
    spfRecord: $('spf-input'), dkimResult: $('dkim-select'), dkimDomain: $('dkim-domain-input'), dmarcRecord: $('dmarc-input')
  };
  const scenarios = [{ id: 'custom', msg: null }, ...MailAuthData.SCENARIOS];
  let runId = 0;          // increases on every run; an older run stops drawing
  let last = null;        // { msg, result } of the latest completed evaluation

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderScenarioOptions() {
    const value = select.value || 'normal';
    select.replaceChildren(...scenarios.map(s => {
      const option = el('option', '', I18n.t(`scenario.${s.id}.name`));
      option.value = s.id;
      return option;
    }));
    select.value = value;
    description.textContent = I18n.t(`scenario.${select.value}.desc`);
  }

  function applyScenario() {
    const scenario = scenarios.find(s => s.id === select.value);
    description.textContent = I18n.t(`scenario.${scenario.id}.desc`);
    for (const [key, input] of Object.entries(fields)) input.value = scenario.msg ? scenario.msg[key] : (key === 'dkimResult' ? 'none' : '');
    clearResults();
  }

  function readForm() {
    const msg = {};
    for (const [key, input] of Object.entries(fields)) msg[key] = input.value.trim();
    return msg;
  }

  // Returns an error message key, or null when the input can be evaluated.
  function validate(msg) {
    if (!MailAuthCore.normalizeDomain(msg.fromDomain)) return 'err.from';
    if (!MailAuthCore.normalizeDomain(msg.mailFromDomain)) return 'err.mailFrom';
    if (!MailAuthCore.parseIP(msg.senderIp)) return 'err.ip';
    if (msg.dkimResult !== 'none' && !MailAuthCore.normalizeDomain(msg.dkimDomain)) return 'err.dkimDomain';
    return null;
  }

  function clearResults() {
    runId += 1;
    last = null;
    progress.value = 0;
    formError.hidden = true;
    for (const box of [dnsBox, stepsBox, finalBox, recBox]) box.replaceChildren();
  }

  function statusClass(status) {
    return 'status-' + String(status).toLowerCase().replace(/[^a-z]/g, '');
  }

  function renderDns(msg) {
    const org = MailAuthCore.organizationalDomain(msg.fromDomain);
    const box = el('div', 'dns-viz-container');
    box.append(el('h4', '', I18n.t('dns.heading')));
    const list = el('ul', 'dns-lookups');
    const row = (label, value, cls) => {
      const li = el('li', `dns-record ${cls}`);
      li.append(el('code', 'dns-query', label), el('code', 'dns-value', value || I18n.t('dns.empty')));
      return li;
    };
    list.append(row(I18n.t('dns.spf', { domain: MailAuthCore.normalizeDomain(msg.mailFromDomain) }), msg.spfRecord, 'spf-record'));
    if (msg.dkimResult !== 'none') {
      const domain = MailAuthCore.normalizeDomain(msg.dkimDomain);
      list.append(row(I18n.t('dns.dkim', { domain }), 'v=DKIM1; k=rsa; p=…', 'dkim-record'));
    }
    list.append(row(I18n.t('dns.dmarc', { domain: org }), msg.dmarcRecord, 'dmarc-record'));
    box.append(list);
    dnsBox.replaceChildren(box);
  }

  // Each step returns { id, status, lines[] }
  function buildSteps(msg, r) {
    const spfKey = { pass: 'spf.pass', fail: 'spf.fail', softfail: 'spf.softfail', neutral: 'spf.neutral', none: 'spf.none', permerror: 'spf.permerror' };
    const spfLines = [I18n.t(spfKey[r.spf.result], { ip: msg.senderIp, matched: r.spf.matched || '', error: r.spf.error || '' })];
    if (r.spf.notEvaluated.length) spfLines.push(I18n.t('spf.notEvaluated', { terms: r.spf.notEvaluated.join(' ') }));
    const dkimLines = [I18n.t(`dkim.result.${msg.dkimResult}`, { domain: MailAuthCore.normalizeDomain(msg.dkimDomain) || '' })];
    const steps = [
      { id: 'spf', status: r.spf.result, lines: spfLines },
      { id: 'dkim', status: msg.dkimResult, lines: dkimLines }
    ];
    const d = r.dmarc;
    if (d.record && d.record.valid) {
      const from = MailAuthCore.normalizeDomain(msg.fromDomain);
      const alignLine = (kind, passed, isAligned, domain, mode) => {
        if (!passed) return I18n.t(`align.${kind}.na`);
        return I18n.t(`align.${kind}.${isAligned ? 'yes' : 'no'}`, { domain: MailAuthCore.normalizeDomain(domain), from, mode: I18n.t(`mode.${mode}`) });
      };
      steps.push({ id: 'align', status: d.spfAligned || d.dkimAligned ? 'aligned' : 'unaligned', lines: [
        alignLine('spf', r.spf.result === 'pass', d.spfAligned, msg.mailFromDomain, d.record.aspf),
        alignLine('dkim', msg.dkimResult === 'pass', d.dkimAligned, msg.dkimDomain, d.record.adkim)
      ] });
      const lines = [I18n.t(d.result === 'pass' ? 'dmarc.pass' : 'dmarc.fail', { tag: d.policyTag, policy: d.policy })];
      if (d.policyTag === 'sp') lines.push(I18n.t('dmarc.subdomain', { org: MailAuthCore.organizationalDomain(from) }));
      steps.push({ id: 'dmarc', status: d.result, lines });
    } else {
      steps.push({ id: 'dmarc', status: 'none', lines: [I18n.t('dmarc.invalid', { error: d.error || '' })] });
    }
    return steps;
  }

  function stepNode(step) {
    const box = el('div', `verification-step ${['pass', 'aligned'].includes(step.status) ? 'success' : 'failure'}`);
    const header = el('div', 'step-header');
    header.append(el('h4', '', I18n.t(`step.${step.id}`)), el('span', `step-status ${statusClass(step.status)}`, step.status.toUpperCase()));
    const details = el('div', 'step-details');
    step.lines.forEach(line => details.append(el('p', '', line)));
    box.append(header, details);
    return box;
  }

  function renderFinal(msg, r) {
    const action = r.action;
    const d = r.dmarc;
    let message;
    if (action === 'accept') message = I18n.t(d.result === 'pass' ? 'final.accept.pass' : d.result === 'fail' ? 'final.accept.none' : 'final.accept.noDmarc');
    else message = I18n.t(`final.${action}.msg`);
    const cls = { accept: d.result === 'pass' ? 'success' : 'warning', quarantine: 'warning', reject: 'danger' }[action];
    const card = el('div', `final-result-card ${cls}`);
    const status = el('div', 'final-status');
    status.append(el('strong', '', I18n.t(`final.${action}`)));
    card.append(el('h3', '', I18n.t('final.heading')), status, el('p', '', message),
      el('p', 'result-breakdown', I18n.t('final.breakdown', { spf: r.spf.result, dkim: msg.dkimResult, dmarc: d.result })),
      el('p', 'final-note', I18n.t('final.note')));
    finalBox.replaceChildren(card);
  }

  function renderRecommendations(msg, r) {
    const recs = [];
    if (r.spf.result === 'permerror') recs.push(I18n.t('rec.spfError', { error: r.spf.error }));
    else if (r.spf.result !== 'pass') recs.push(I18n.t('rec.spfAdd', { ip: msg.senderIp }));
    if (r.spf.notEvaluated.length) recs.push(I18n.t('rec.spfNotEvaluated'));
    const d = r.dmarc;
    if (!(d.record && d.record.valid)) recs.push(I18n.t('rec.dmarcInvalid'));
    else {
      if (r.spf.result === 'pass' && !d.spfAligned) recs.push(I18n.t('rec.align'));
      if (!d.dkimAligned) recs.push(I18n.t('rec.dkim', { from: MailAuthCore.normalizeDomain(msg.fromDomain) }));
      if (d.record.p === 'none') recs.push(I18n.t('rec.policyNone'));
    }
    const box = el('div', 'recommendations-container');
    box.append(el('h4', '', I18n.t('rec.heading')));
    if (!recs.length) box.append(el('p', 'all-good', I18n.t('rec.none')));
    else {
      const list = el('ul', 'recommendation-list');
      recs.forEach(text => list.append(el('li', 'recommendation-item', text)));
      box.append(list);
    }
    recBox.replaceChildren(box);
  }

  const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  async function run(msg, animate) {
    const id = ++runId;
    const result = MailAuthCore.evaluateMessage(msg);
    formError.hidden = true;
    for (const box of [stepsBox, finalBox, recBox]) box.replaceChildren();
    renderDns(msg);
    const steps = buildSteps(msg, result);
    progress.max = steps.length;
    for (let i = 0; i < steps.length; i++) {
      if (animate && !reduceMotion()) { await wait(STEP_DELAY_MS); if (id !== runId) return; }
      stepsBox.append(stepNode(steps[i]));
      progress.value = i + 1;
    }
    renderFinal(msg, result);
    renderRecommendations(msg, result);
    last = { msg };
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const msg = readForm();
    const error = validate(msg);
    if (error) {
      clearResults();
      formError.textContent = I18n.t(error);
      formError.dataset.key = error;
      formError.hidden = false;
      return;
    }
    run(msg, true);
  });
  select.addEventListener('change', applyScenario);
  for (const input of Object.values(fields)) input.addEventListener('input', () => { if (last) clearResults(); });

  document.addEventListener('languagechange', () => {
    renderScenarioOptions();
    if (!formError.hidden && formError.dataset.key) formError.textContent = I18n.t(formError.dataset.key);
    if (last) run(last.msg, false);
  });

  renderScenarioOptions();
  applyScenario();
});
