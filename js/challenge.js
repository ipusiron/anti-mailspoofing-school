// Challenge tab: questions from MailAuthData, answers from MailAuthCore, progression from ChallengeLogic.
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const container = $('question-container');
  const levelButtons = [...document.querySelectorAll('.level-btn')];
  const notice = $('challenge-notice');
  const ANSWERS = ['accept', 'quarantine', 'reject'];
  const view = {
    progress: ChallengeLogic.initialState(),
    level: 1,
    screen: 'start',          // 'start' | 'question'
    question: null,
    choice: null,             // selected radio value before submitting
    answered: null,           // submitted answer
    lastId: null,
    noticeKey: null, noticeLevel: null
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function correctAnswer(question) {
    return MailAuthCore.evaluateMessage(question.msg).action;
  }

  function spfSummary(msg) {
    const r = MailAuthCore.evaluateSpf(msg.spfRecord, msg.senderIp);
    return r.matched ? `${r.result} (${r.matched})` : r.result;
  }

  function logLines(msg) {
    const org = MailAuthCore.organizationalDomain(msg.fromDomain);
    return [
      ['q.log.from', msg.fromDomain],
      ['q.log.mailFrom', msg.mailFromDomain],
      ['q.log.ip', msg.senderIp],
      ['q.log.spfRecord', msg.spfRecord],
      ['q.log.spf', spfSummary(msg)],
      ['q.log.dkim', msg.dkimResult === 'none' ? 'none' : `${msg.dkimResult} (d=${msg.dkimDomain})`],
      ['q.log.dmarcRecord', `_dmarc.${org}: ${msg.dmarcRecord}`]
    ];
  }

  function renderStatus() {
    const p = view.progress;
    $('accuracy').textContent = `${ChallengeLogic.accuracy(p)}%`;
    $('streak').textContent = String(p.streak);
    $('current-level').textContent = I18n.t(`level.name.${view.level}`);
    const levelName = I18n.t(`level.name.${view.level}`);
    $('level-progress').value = p.completed ? 3 : (view.level === p.maxLevel ? p.streak : 0);
    $('progress-text').textContent = p.completed ? I18n.t('ch.complete')
      : I18n.t(view.level === p.maxLevel ? 'ch.progress' : 'ch.progressLower', { level: levelName, streak: p.streak });
    levelButtons.forEach(btn => {
      const level = Number(btn.dataset.level);
      const unlocked = level <= p.maxLevel;
      btn.disabled = !unlocked;
      btn.classList.toggle('locked', !unlocked);
      btn.classList.toggle('active', level === view.level);
      btn.setAttribute('aria-pressed', String(level === view.level));
    });
    notice.hidden = !view.noticeKey;
    if (view.noticeKey) notice.textContent = I18n.t(view.noticeKey, { level: I18n.t(`level.name.${view.noticeLevel}`) });
  }

  function renderStart() {
    const btn = el('button', 'start-btn', I18n.t('ch.startLevel', { level: I18n.t(`level.name.${view.level}`) }));
    btn.type = 'button';
    btn.id = 'start-challenge';
    btn.addEventListener('click', startQuestion);
    container.replaceChildren(btn);
  }

  function renderQuestion() {
    const q = view.question;
    const card = el('div', 'question-card');
    const header = el('div', 'question-header');
    const meta = el('div', 'question-meta');
    meta.append(el('span', `level-badge level-${q.level}`, I18n.t(`level.name.${q.level}`)));
    header.append(el('h3', '', I18n.t(`q.${q.id}.title`)), meta);
    const logBox = el('div', 'log-display');
    logBox.append(el('h4', '', I18n.t('q.logHeading')));
    const dl = el('dl', 'auth-log');
    for (const [key, value] of logLines(q.msg)) dl.append(el('dt', '', I18n.t(key)), el('dd', '', value));
    logBox.append(dl);

    const form = el('form', 'quiz-form');
    const fieldset = el('fieldset', 'answer-options');
    fieldset.append(el('legend', '', I18n.t('q.prompt')));
    for (const answer of ANSWERS) {
      const label = el('label', 'answer-option');
      const input = el('input');
      input.type = 'radio';
      input.name = 'answer';
      input.value = answer;
      input.checked = (view.answered || view.choice) === answer;
      input.disabled = view.answered !== null;
      input.addEventListener('change', () => { view.choice = answer; submit.disabled = false; });
      label.append(input, el('span', 'option-text', I18n.t(`answer.${answer}`)), el('small', '', I18n.t(`answer.${answer}.desc`)));
      fieldset.append(label);
    }
    const submit = el('button', 'submit-btn', I18n.t('q.submit'));
    submit.type = 'submit';
    submit.disabled = view.answered !== null || view.choice === null;
    form.append(fieldset, submit);
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (view.answered !== null || view.choice === null) return;
      answer(view.choice);
    });
    card.append(header, logBox, form);
    if (view.answered !== null) card.append(resultNode(q));
    container.replaceChildren(card);
  }

  function resultNode(q) {
    const right = correctAnswer(q);
    const isCorrect = view.answered === right;
    const box = el('div', `result-card ${isCorrect ? 'correct' : 'incorrect'}`);
    box.setAttribute('role', 'status');
    box.append(el('h4', '', I18n.t(isCorrect ? 'q.correct' : 'q.incorrect')),
      el('p', '', I18n.t('q.yourAnswer', { answer: I18n.t(`answer.${view.answered}`) })),
      el('p', '', I18n.t('q.answer', { answer: I18n.t(`answer.${right}`) })));
    const explain = el('div', 'explanation');
    explain.append(el('h5', '', I18n.t('q.explanation')), el('p', '', I18n.t(`q.${q.id}.explain`)));
    const actions = el('div', 'result-actions');
    const next = el('button', 'next-btn', I18n.t('q.next'));
    next.type = 'button';
    next.addEventListener('click', startQuestion);
    const change = el('button', 'level-btn-small', I18n.t('q.changeLevel'));
    change.type = 'button';
    change.addEventListener('click', () => { view.screen = 'start'; view.question = null; render(); });
    actions.append(next, change);
    box.append(explain, actions);
    return box;
  }

  function render() {
    renderStatus();
    if (view.screen === 'question' && view.question) renderQuestion();
    else renderStart();
  }

  function startQuestion() {
    view.question = ChallengeLogic.nextQuestion(MailAuthData.QUESTIONS, view.level, view.lastId, Math.random);
    view.lastId = view.question.id;
    view.choice = null;
    view.answered = null;
    view.noticeKey = null;
    view.screen = 'question';
    render();
    const first = container.querySelector('input[name="answer"]');
    if (first) first.focus();
  }

  function answer(choice) {
    view.answered = choice;
    const { state, event } = ChallengeLogic.recordAnswer(view.progress, view.level, choice === correctAnswer(view.question));
    view.progress = state;
    if (event === 'unlock') { view.noticeKey = 'ch.unlock'; view.noticeLevel = state.maxLevel; }
    if (event === 'complete') { view.noticeKey = 'ch.complete'; view.noticeLevel = 3; }
    render();
  }

  levelButtons.forEach(btn => btn.addEventListener('click', () => {
    const level = Number(btn.dataset.level);
    if (level > view.progress.maxLevel) return;
    view.level = level;
    view.screen = 'start';
    view.question = null;
    view.noticeKey = null;
    render();
  }));

  document.addEventListener('languagechange', render);
  render();
});
