// Header reader tab: explains the Authentication-Results headers of a pasted message.
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const input = $('header-input');
  const results = $('header-results');
  const samples = $('header-samples');
  const KNOWN_RESULTS = ['pass', 'fail', 'softfail', 'neutral', 'none', 'temperror', 'permerror', 'policy'];
  let shown = false;      // redraw on language change only after a run

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderSamples() {
    samples.replaceChildren(...Object.keys(MailAuthData.HEADER_SAMPLES).map(id => {
      const button = el('button', 'sample-btn', I18n.t('hdr.sample', { name: I18n.t(`hdr.sample.${id}`) }));
      button.type = 'button';
      button.addEventListener('click', () => {
        input.value = MailAuthData.HEADER_SAMPLES[id];
        run();
      });
      return button;
    }));
  }

  function resultText(result) {
    return KNOWN_RESULTS.includes(result) ? I18n.t(`hdr.result.${result}`) : I18n.t('hdr.result.other', { result });
  }

  // One method: name, result badge and the explanation lines
  function row(method, entry) {
    const item = el('li', 'hdr-row');
    const name = I18n.t(`hdr.method.${method}`);
    item.append(el('span', 'hdr-method', name));
    const body = el('div', 'hdr-body');
    item.append(body);
    if (!entry) {
      body.append(el('p', 'hdr-missing', I18n.t('hdr.missing', { method: name })));
      return item;
    }
    const badge = entry.result === 'pass' ? 'status-pass' : `status-${KNOWN_RESULTS.includes(entry.result) ? entry.result : 'other'}`;
    body.append(el('span', `step-status ${badge}`, entry.result), el('p', 'hdr-text', resultText(entry.result)));
    if (entry.domain) body.append(el('p', 'hdr-text', I18n.t('hdr.domain', { domain: entry.domain })));
    if (typeof entry.aligned === 'boolean') {
      body.append(el('p', `hdr-text ${entry.aligned ? 'hdr-aligned' : 'hdr-unaligned'}`,
        I18n.t(entry.aligned ? 'hdr.aligned.yes' : 'hdr.aligned.no')));
    }
    return item;
  }

  function block(info, index) {
    const card = el('section', 'hdr-card');
    card.append(el('h3', 'hdr-card-title', I18n.t('hdr.block', { index: index + 1, server: info.authservId || '?' })));
    card.append(el('p', 'hdr-from', info.from ? I18n.t('hdr.from', { domain: info.from }) : I18n.t('hdr.fromUnknown')));
    const list = el('ul', 'hdr-list');
    list.append(row('spf', info.spf));
    if (info.dkim.length === 0) list.append(row('dkim', null));
    for (const d of info.dkim) list.append(row('dkim', d));
    list.append(row('dmarc', info.dmarc));
    card.append(list);
    if (info.others.length) {
      card.append(el('p', 'hdr-other', I18n.t('hdr.other', { list: info.others.map(o => `${o.method}=${o.result}`).join(', ') })));
    }
    return card;
  }

  function run() {
    const infos = MailAuthTools.readHeaders(input.value);
    const nodes = [];
    if (infos.length === 0) nodes.push(el('p', 'hdr-notice', I18n.t('hdr.none')));
    if (infos.length > 1) nodes.push(el('p', 'hdr-warning', I18n.t('hdr.multiple', { count: infos.length })));
    infos.forEach((info, i) => nodes.push(block(info, i)));
    results.replaceChildren(...nodes);
    shown = true;
  }

  $('header-run').addEventListener('click', run);
  document.addEventListener('languagechange', () => {
    renderSamples();
    if (shown) run();
  });
  renderSamples();
});
