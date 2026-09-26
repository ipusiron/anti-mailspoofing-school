// Learn tab: topic cards and the step-by-step authentication flow.
document.addEventListener('DOMContentLoaded', () => {
  const TOPICS = [
    { id: 'spf', icon: '🔹' },
    { id: 'dkim', icon: '🔸' },
    { id: 'dmarc', icon: '🔺' },
    { id: 'align', icon: '🪪' }
  ];
  const FLOW = [
    { step: 1, icon: '📮' },
    { step: 2, icon: '🌐', badge: 'SPF', badgeClass: 'spf-check' },
    { step: 3, icon: '🔐', badge: 'DKIM', badgeClass: 'dkim-check' },
    { step: 4, icon: '📋', badge: 'DMARC', badgeClass: 'dmarc-check' },
    { step: 5, icon: '📨' }
  ];
  const STEP_DELAY_MS = 1500;
  const cards = document.getElementById('learn-cards');
  const diagram = document.getElementById('flow-diagram');
  const explanation = document.getElementById('step-explanation');
  const playBtn = document.getElementById('play-animation');
  const resetBtn = document.getElementById('reset-animation');
  const state = { selected: null, animated: 0, playing: false, timer: null };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderCards() {
    cards.replaceChildren(...TOPICS.map(topic => {
      const card = el('article', 'learn-card');
      const header = el('div', 'card-header');
      header.append(el('span', 'card-icon', topic.icon), el('h3', '', I18n.t(`card.${topic.id}.title`)));
      const analogy = el('div', 'card-analogy');
      analogy.append(el('span', 'analogy-icon', I18n.t(`card.${topic.id}.analogy`)));
      const content = el('div', 'card-content');
      const details = el('div', 'card-details');
      details.append(el('h4', '', I18n.t('card.techHeading')), el('p', '', I18n.t(`card.${topic.id}.technical`)));
      const example = el('div', 'card-example');
      example.append(el('span', 'example-label', I18n.t('card.exampleLabel')), el('p', '', I18n.t(`card.${topic.id}.example`)));
      content.append(el('p', 'card-description', I18n.t(`card.${topic.id}.description`)), details, example);
      card.append(header, analogy, content);
      return card;
    }));
  }

  // The flow is drawn only from `state`, so language changes keep the progress.
  function renderFlow() {
    const nodes = [];
    FLOW.forEach((item, i) => {
      if (i > 0) nodes.push(el('div', 'flow-arrow', '→'));
      const btn = el('button', 'flow-step');
      btn.type = 'button';
      btn.dataset.step = String(item.step);
      btn.classList.toggle('animated', i < state.animated);
      btn.classList.toggle('active', state.selected === item.step);
      btn.setAttribute('aria-pressed', String(state.selected === item.step));
      btn.append(el('span', 'step-icon', item.icon), el('span', 'step-label', I18n.t(`flow.${item.step}.label`)),
        el('span', 'step-detail', I18n.t(`flow.${item.step}.detail`)));
      if (item.badge) btn.append(el('span', `check-badge ${item.badgeClass}`, item.badge));
      btn.addEventListener('click', () => { stop(); state.selected = item.step; render(); });
      nodes.push(btn);
    });
    diagram.replaceChildren(...nodes);
    explanation.replaceChildren();
    explanation.classList.toggle('show', state.selected !== null);
    if (state.selected !== null) {
      explanation.append(el('h4', '', I18n.t(`flow.${state.selected}.title`)), el('p', '', I18n.t(`flow.${state.selected}.content`)));
    }
    playBtn.textContent = I18n.t(state.playing ? 'flow.stop' : 'flow.play');
    playBtn.classList.toggle('playing', state.playing);
  }

  function render() {
    renderCards();
    renderFlow();
  }

  function stop() {
    state.playing = false;
    clearTimeout(state.timer);
    state.timer = null;
  }

  function tick() {
    if (!state.playing) return;
    state.animated += 1;
    state.selected = state.animated;
    if (state.animated >= FLOW.length) state.playing = false;
    renderFlow();
    if (state.playing) state.timer = setTimeout(tick, STEP_DELAY_MS);
  }

  playBtn.addEventListener('click', () => {
    if (state.playing) { stop(); renderFlow(); return; }
    stop();
    state.animated = 0;
    state.selected = null;
    state.playing = true;
    tick();
  });
  resetBtn.addEventListener('click', () => {
    stop();
    state.animated = 0;
    state.selected = null;
    renderFlow();
  });

  document.addEventListener('languagechange', render);
  render();
});
