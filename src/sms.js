// SMS follow-up: the result text after a call, one practice question a day (answered by replying
// A-D), and a short report for a parent or teacher. Messages are folded to GSM-safe text so they
// fit basic phones. Pure functions; a gateway (e.g. Africa's Talking SMS) only has to send them.
(function (root) {
  const dep = (n, g) => (typeof require !== 'undefined' ? require(n) : root[g]);
  const P0 = dep('./pack', 'RootPathPack');
  const { bkt, learnStep } = dep('./engine', 'RootPathEngine');
  const { gsm } = dep('./ussd', 'RootPathUssd');
  const { smsEncode } = dep('./router', 'RootPathRouter');

  const W = {
    en: { hi: 'Hi {name}!', gap: 'Your gap starts at: {roots}.', path: 'Path: {path}.', nogap: 'Well done, no gap in {topic}.', daily: 'A practice question comes every day. Reply STOP to end.',
      day: 'Day {d}', reply: 'Reply A, B, C or D', right: 'Correct! {skill}: {p}%.', wrong: 'Not quite. Answer: {a}. {fix}', report: 'RootPath report for {name}: gap at {roots}. {skill}: {a}% -> {b}% in {d} days.', code: 'Code: {code}', bad: 'Please reply A, B, C or D.' },
    pcm: { hi: 'How far {name}!', gap: 'Your wahala start for: {roots}.', path: 'Path: {path}.', nogap: 'Well done, no wahala for {topic}.', daily: 'Every day we go send you one question. Reply STOP to end.',
      day: 'Day {d}', reply: 'Reply A, B, C or D', right: 'Correct! {skill}: {p}%.', wrong: 'E no correct. Answer na {a}. {fix}', report: 'RootPath report for {name}: wahala start for {roots}. {skill}: {a}% -> {b}% for {d} days.', code: 'Code: {code}', bad: 'Abeg reply A, B, C or D.' },
  };
  const w = (L, k, v = {}) => ((W[L] && W[L][k]) || W.en[k]).replace(/\{(\w+)\}/g, (_, x) => v[x] ?? '');
  const ABCD = 'ABCD';
  const fold = (s) => gsm(String(s));

  /** The SMS sent right after the diagnosis call. */
  function resultSms({ name = 'Learner', result, lang = 'en', pack = P0 }) {
    const nm = (x) => pack.text.skillName(x, lang);
    const body = result.roots.length
      ? [w(lang, 'gap', { roots: result.roots.map(nm).join(', ') }), w(lang, 'path', { path: result.path.map(nm).join(' > ') })]
      : [w(lang, 'nogap', { topic: nm(result.target) })];
    return fold(['RootPath: ' + w(lang, 'hi', { name }), ...body, w(lang, 'daily')].join('\n'));
  }

  /** Practice question for a given day, rotating through the skill's questions. */
  function dailySms({ skill, day = 1, lang = 'en', pack = P0 }) {
    const items = pack.bank.filter((q) => q.s === skill);
    const q = items[(day - 1) % items.length];
    const text = [`RootPath ${w(lang, 'day', { d: day })} - ${pack.text.skillName(skill, lang)}`, pack.text.qText(q, lang), q.o.map((o, i) => `${ABCD[i]}) ${o[0]}`).join('  '), w(lang, 'reply')].join('\n');
    return { text: fold(text), question: q };
  }

  /** Mark a reply ("b", "B)", "2"...). Returns the feedback SMS and the updated mastery. */
  function replySms({ question, reply, p = 0.3, lang = 'en', pack = P0 }) {
    const m = String(reply || '').trim().match(/^([abcd]|[1-4])\b/i);
    if (!m) return { text: fold(w(lang, 'bad')), valid: false, p };
    const i = /\d/.test(m[1]) ? Number(m[1]) - 1 : ABCD.indexOf(m[1].toUpperCase());
    const o = question.o[i], ok = !!o[1], np = learnStep(bkt(p, ok));
    const skill = pack.text.skillName(question.s, lang);
    const ans = question.o.findIndex((x) => x[1]);
    const text = ok ? w(lang, 'right', { skill, p: Math.round(np * 100) }) : w(lang, 'wrong', { a: `${ABCD[ans]} (${question.o[ans][0]})`, fix: o[2] ? pack.text.fix(o[2], lang) : '' }).trim();
    return { text: fold(text), valid: true, correct: ok, p: np };
  }

  /** Short progress report for a parent or teacher, with the RP1 progress code. */
  function reportSms({ name = 'Learner', result, skill, before, after, days, lang = 'en', pack = P0 }) {
    const nm = (x) => pack.text.skillName(x, lang);
    const code = smsEncode({ ...result.mastery, [skill]: after });
    return fold([w(lang, 'report', { name, roots: result.roots.map(nm).join(', ') || '-', skill: nm(skill), a: Math.round(before * 100), b: Math.round(after * 100), d: days }), w(lang, 'code', { code })].join('\n'));
  }

  const api = { resultSms, dailySms, replySms, reportSms };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RootPathSms = api;
})(typeof self !== 'undefined' ? self : this);
