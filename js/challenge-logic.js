// Pure progression rules of the challenge (no DOM).
const ChallengeLogic = (() => {
  const STREAK_TO_ADVANCE = 3;
  const MAX_LEVEL = 3;

  function initialState() {
    return { maxLevel: 1, correct: 0, total: 0, streak: 0, completed: false };
  }

  // Records one answer. Only answers at the highest unlocked level move the streak.
  // Returns { state, event } where event is null, 'unlock' or 'complete'.
  function recordAnswer(prev, level, isCorrect) {
    const s = { ...prev, total: prev.total + 1, correct: prev.correct + (isCorrect ? 1 : 0) };
    if (level !== s.maxLevel || s.completed) return { state: s, event: null };
    s.streak = isCorrect ? s.streak + 1 : 0;
    if (s.streak < STREAK_TO_ADVANCE) return { state: s, event: null };
    if (s.maxLevel < MAX_LEVEL) return { state: { ...s, maxLevel: s.maxLevel + 1, streak: 0 }, event: 'unlock' };
    return { state: { ...s, completed: true }, event: 'complete' };
  }

  // Picks the next question of a level, never the same id twice in a row. random() returns [0, 1).
  function nextQuestion(questions, level, lastId, random) {
    const pool = questions.filter(q => q.level === level);
    const choices = pool.length > 1 ? pool.filter(q => q.id !== lastId) : pool;
    return choices[Math.floor(random() * choices.length)] || null;
  }

  function accuracy(state) {
    return state.total ? Math.round(state.correct / state.total * 100) : 0;
  }

  return { STREAK_TO_ADVANCE, MAX_LEVEL, initialState, recordAnswer, nextQuestion, accuracy };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = ChallengeLogic;
