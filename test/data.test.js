const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/mailauth-core.js');
const D = require('../js/mailauth-data.js');
const L = require('../js/challenge-logic.js');
const I18n = require('../js/i18n.js');

const EXPECTED_SCENARIOS = {
  normal: 'accept', spoof: 'reject', unaligned: 'reject', 'dkim-fail': 'accept', monitor: 'accept',
  forwarded: 'accept', esp: 'accept', strict: 'reject', subdomain: 'quarantine', substring: 'quarantine'
};

test('every scenario evaluates to the documented action', () => {
  assert.equal(D.SCENARIOS.length, Object.keys(EXPECTED_SCENARIOS).length);
  for (const s of D.SCENARIOS) assert.equal(C.evaluateMessage(s.msg).action, EXPECTED_SCENARIOS[s.id], s.id);
});

test('every question answer is computed, not typed', () => {
  assert.equal(D.QUESTIONS.length, 12);
  for (const level of [1, 2, 3]) assert.equal(D.QUESTIONS.filter(q => q.level === level).length, 4, `level ${level}`);
  assert.equal(new Set(D.QUESTIONS.map(q => q.id)).size, D.QUESTIONS.length);
  for (const q of D.QUESTIONS) assert.equal(C.evaluateMessage(q.msg).action, q.expected, q.id);
  for (const level of [1, 2, 3]) {
    const answers = new Set(D.QUESTIONS.filter(q => q.level === level).map(q => q.expected));
    assert.ok(answers.size >= 3, `level ${level} mixes accept, quarantine and reject`);
  }
});

test('examples use only documentation domains and addresses', () => {
  const domainOk = d => d === '' || /(^|\.)example\.(com|net|org)$/.test(d);
  const ipOk = ip => /^(192\.0\.2|198\.51\.100|203\.0\.113)\.\d+$/.test(ip) || /^2001:db8:/i.test(ip);
  for (const item of [...D.SCENARIOS, ...D.QUESTIONS]) {
    const m = item.msg;
    for (const d of [m.fromDomain, m.mailFromDomain, m.dkimDomain]) assert.ok(domainOk(d), `${item.id}: ${d}`);
    assert.ok(ipOk(m.senderIp), `${item.id}: ${m.senderIp}`);
    for (const net of m.spfRecord.match(/ip4:[^\s]+/g) || []) assert.ok(ipOk(net.slice(4).split('/')[0]), `${item.id}: ${net}`);
  }
});

test('every scenario and question has texts in both languages', () => {
  for (const lang of ['ja', 'en']) {
    for (const s of [{ id: 'custom' }, ...D.SCENARIOS]) {
      for (const k of ['name', 'desc']) assert.ok(I18n[lang][`scenario.${s.id}.${k}`], `${lang} ${s.id}.${k}`);
    }
    for (const q of D.QUESTIONS) for (const k of ['title', 'explain']) assert.ok(I18n[lang][`q.${q.id}.${k}`], `${lang} ${q.id}.${k}`);
  }
});

test('challenge progression', () => {
  let s = L.initialState();
  for (let i = 0; i < 2; i++) s = L.recordAnswer(s, 1, true).state;
  let r = L.recordAnswer(s, 1, true);
  assert.equal(r.event, 'unlock');
  assert.equal(r.state.maxLevel, 2);
  assert.equal(r.state.streak, 0);
  // answers below the highest unlocked level do not move the streak
  r = L.recordAnswer(r.state, 1, true);
  assert.equal(r.state.streak, 0);
  assert.equal(r.state.total, 4);
  // a wrong answer at the highest level resets the streak
  s = L.recordAnswer(L.recordAnswer(r.state, 2, true).state, 2, false).state;
  assert.equal(s.streak, 0);
  for (let i = 0; i < 3; i++) s = L.recordAnswer(s, 2, true).state;
  assert.equal(s.maxLevel, 3);
  for (let i = 0; i < 2; i++) s = L.recordAnswer(s, 3, true).state;
  r = L.recordAnswer(s, 3, true);
  assert.equal(r.event, 'complete');
  assert.equal(r.state.completed, true);
  assert.equal(L.recordAnswer(r.state, 3, true).event, null);
  assert.equal(L.accuracy({ correct: 2, total: 3 }), 67);
  assert.equal(L.accuracy(L.initialState()), 0);
});

test('the next question never repeats the previous one', () => {
  let last = null;
  for (let i = 0; i < 200; i++) {
    const q = L.nextQuestion(D.QUESTIONS, 1 + (i % 3), last, Math.random);
    assert.notEqual(q.id, last);
    last = q.id;
  }
  assert.equal(L.nextQuestion(D.QUESTIONS, 2, 'q5', () => 0).id, 'q6');
});
