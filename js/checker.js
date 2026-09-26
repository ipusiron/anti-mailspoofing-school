// Record checker tab: lints SPF and DMARC records with MailAuthTools and lists the findings.
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const spfInput = $('lint-spf-input');
  const dmarcInput = $('lint-dmarc-input');
  const results = $('lint-results');
  const samples = $('checker-samples');
  const LEVEL_ORDER = { error: 0, warning: 1, info: 2 };
  let shown = false;      // redraw on language change only after a run

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderSamples() {
    samples.replaceChildren(...Object.keys(MailAuthData.LINT_SAMPLES).map(id => {
      const button = el('button', 'sample-btn', I18n.t('chk.sample', { name: I18n.t(`chk.sample.${id}`) }));
      button.type = 'button';
      button.addEventListener('click', () => {
        spfInput.value = MailAuthData.LINT_SAMPLES[id].spf;
        dmarcInput.value = MailAuthData.LINT_SAMPLES[id].dmarc;
        run();
      });
      return button;
    }));
  }

  // One record: heading, overall status and the findings (errors first)
  function section(headingKey, record, lint) {
    const box = el('section', 'lint-section');
    const heading = el('h3', 'lint-heading', I18n.t(headingKey));
    box.append(heading);
    if (record.trim() === '') {
      box.append(el('p', 'lint-skipped', I18n.t('chk.skipped')));
      return box;
    }
    const findings = lint(record).sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
    const status = MailAuthTools.worst(findings);
    heading.append(' ', el('span', `lint-status lint-status-${status}`, I18n.t(`chk.status.${status}`)));
    const list = el('ul', 'lint-list');
    for (const f of findings) {
      const item = el('li', `lint-item lint-${f.level}`);
      item.append(el('span', `lint-level lint-level-${f.level}`, I18n.t(`level.${f.level}`)), el('span', 'lint-text', I18n.t(f.key, f.values)));
      list.append(item);
    }
    box.append(list);
    return box;
  }

  function run() {
    results.replaceChildren(
      section('chk.spfHeading', spfInput.value, MailAuthTools.lintSpf),
      section('chk.dmarcHeading', dmarcInput.value, MailAuthTools.lintDmarc));
    shown = true;
  }

  $('lint-run').addEventListener('click', run);
  document.addEventListener('languagechange', () => {
    renderSamples();
    if (shown) run();
  });
  renderSamples();
});
