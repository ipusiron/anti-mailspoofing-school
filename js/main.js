// Tabs, help dialog and language switching.
document.addEventListener('DOMContentLoaded', () => {
  I18n.init();

  // ---------- Tabs (WAI-ARIA tabs pattern) ----------
  const tabs = [...document.querySelectorAll('.tab-button')];

  function activateTab(tab, focus) {
    tabs.forEach(btn => {
      const selected = btn === tab;
      btn.classList.toggle('active', selected);
      btn.setAttribute('aria-selected', String(selected));
      btn.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(btn.dataset.tab);
      panel.classList.toggle('active', selected);
      panel.hidden = !selected;
    });
    if (focus) tab.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab, false));
    tab.addEventListener('keydown', event => {
      const keys = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 };
      if (!(event.key in keys)) return;
      event.preventDefault();
      activateTab(tabs[(keys[event.key] + tabs.length) % tabs.length], true);
    });
  });

  // ---------- Help dialog ----------
  const helpButton = document.getElementById('help-button');
  const helpModal = document.getElementById('help-modal');
  const helpBody = document.getElementById('help-body');

  function renderHelp() {
    helpBody.replaceChildren();
    for (const n of [1, 2, 3, 4, 6, 7, 5]) {
      const section = document.createElement('div');
      section.className = 'help-section';
      const heading = document.createElement('h3');
      heading.textContent = I18n.t(`help.s${n}.h`);
      const text = document.createElement('p');
      text.textContent = I18n.t(`help.s${n}.p`);
      section.append(heading, text);
      helpBody.append(section);
    }
  }

  helpButton.addEventListener('click', () => {
    renderHelp();
    helpModal.showModal();
  });
  document.getElementById('help-close').addEventListener('click', () => helpModal.close());
  helpModal.addEventListener('click', event => {
    if (event.target === helpModal) helpModal.close();
  });
  helpModal.addEventListener('close', () => helpButton.focus());

  // ---------- Language ----------
  document.getElementById('lang-button').addEventListener('click', () => {
    I18n.setLanguage(I18n.language === 'ja' ? 'en' : 'ja');
  });
  document.addEventListener('languagechange', () => {
    if (helpModal.open) renderHelp();
  });
});
