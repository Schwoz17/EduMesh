// Voice-call tutor: the phone conversation as a pure state machine (no I/O).
// The browser demo speaks it with text-to-speech; tools/at-voice.js serves the same session
// to real phone calls (Africa's Talking voice XML). Keys 1-9 answer, * repeats.
(function (root) {
  const dep = (n, g) => (typeof require !== 'undefined' ? require(n) : root[g]);
  const P0 = dep('./pack', 'RootPathPack');
  const { Diagnosis, Practice } = dep('./engine', 'RootPathEngine');

  const LANGS = ['en', 'pcm', 'yo', 'ig', 'ha'];
  const VOICE = { en: 'en-NG', pcm: 'en-NG', yo: 'yo-NG', ig: 'ig-NG', ha: 'ha-NG' };
  // Spoken prompts. English is reviewed; Pidgin is a draft (like the rest of the Pidgin layer).
  // Yoruba, Igbo and Hausa greet in their language and fall back to English for the rest (draft).
  const SAY = {
    en: {
      hi: 'Welcome to RootPath, your free tutor on any phone.',
      lang: 'For English, press 1. For Pidgin, press 2. For Yoruba, press 3. For Igbo, press 4. For Hausa, press 5.',
      subject: 'Which subject? Press 1 for Maths. Press 2 for Physics. Press 3 for English.',
      topic: 'Which topic is hard for you?',
      intro: 'I will ask a few short questions to find where the problem really starts. Press the number of your answer.',
      q: 'Question {n}.', opt: 'Press {k} for {o}.',
      right: 'Correct!', wrong: 'Not quite.',
      found: 'I found where your gap starts: {roots}.', path: 'Your path back up is: {path}.',
      nogap: 'Well done! You know {topic}. No gap found.',
      plan: 'I will send you one practice question by SMS every day, and call you again on Saturday to check your progress.',
      bye: 'Goodbye, and keep learning!', invalid: 'Sorry, I did not get that.', star: 'Press star to hear it again.',
      checkHi: 'Hello {name}! This is RootPath, calling for your weekly check on {skill}.',
      lesson: 'Quick reminder: {lesson}',
      checkDone: 'Your level in {skill} went from {a} percent to {b} percent. Great work!',
    },
    pcm: {
      hi: 'Welcome to RootPath, your free teacher for any phone.',
      subject: 'Which subject? Press 1 for Maths. Press 2 for Physics. Press 3 for English.',
      topic: 'Which topic dey hard you?',
      intro: 'I go ask you small questions to find where the wahala start. Press the number of your answer.',
      q: 'Question {n}.', opt: 'Press {k} for {o}.',
      right: 'Correct!', wrong: 'E no correct.',
      found: 'I don find where the wahala start: {roots}.', path: 'Your path na: {path}.',
      nogap: 'Well done! You sabi {topic}. No wahala dey.',
      plan: 'Every day I go send you one practice question by SMS, and I go call you again on Saturday to check how you dey do.',
      bye: 'Bye bye, continue to learn!', invalid: 'Sorry, I no hear am well.', star: 'Press star to hear am again.',
      checkHi: 'Hello {name}! Na RootPath dey call you for your weekly check on {skill}.',
      lesson: 'Small reminder: {lesson}',
      checkDone: 'Your level for {skill} don move from {a} percent to {b} percent. Well done!',
    },
    yo: { hi: 'Ẹ káàbọ̀ sí RootPath.' },
    ig: { hi: 'Nnọọ na RootPath.' },
    ha: { hi: 'Barka da zuwa RootPath.' },
  };
  const t = (L, k, v = {}) => ((SAY[L] && SAY[L][k]) || SAY.en[k]).replace(/\{(\w+)\}/g, (_, x) => v[x] ?? '');

  // Turn written maths into words a voice can read: "1/2" -> "1 over 2", "×" -> "times".
  function speakable(s) {
    return String(s)
      .replace(/\?\s*\/\s*(\d+)/g, 'what over $1')
      .replace(/(\d+)\s*\/\s*(\d+)/g, '$1 over $2')
      .replace(/×/g, ' times ').replace(/÷/g, ' divided by ')
      .replace(/(^|\s)[−-](?=\d)/g, '$1minus ').replace(/\s[−-]\s/g, ' minus ')
      .replace(/=\s*\?/g, 'equals what?').replace(/=/g, ' equals ').replace(/²/g, ' squared').replace(/\+/g, ' plus ')
      .replace(/→/g, ', so ').replace(/[−–]/g, ' minus ')
      .replace(/\s+/g, ' ').replace(/\s+([.,!?;:])/g, '$1').trim();
  }

  // Build a prompt: what to say aloud, what to show as captions, and which keys are valid.
  // `say` on a part may be one string or a list of pieces; each piece can be a pre-recorded clip.
  const prompt = (L, parts, extra = {}) => {
    const segments = parts.flatMap((p) => (p.say != null ? [].concat(p.say) : [speakable(p.text)])).filter(Boolean);
    return {
    lang: L, voice: VOICE[L], segments, say: segments.join(' '),
    lines: parts.filter((p) => p.text != null).map((p) => ({ text: p.text, kind: p.kind || 'say' })),
    keys: [], end: false, ...extra,
  };
  };

  class CallSession {
    constructor({ pack = P0, caller = 'Learner' } = {}) {
      Object.assign(this, { P: pack, caller, L: 'en', phase: 'lang', subject: null, target: null, D: null, last: null, result: null, log: [] });
    }
    start() { return (this.last = this._lang([{ text: t('en', 'hi') }])); }
    _lang(pre) {
      return prompt('en', [...pre, { text: t('en', 'lang') }], { phase: 'lang', keys: LANGS.map((l, i) => ({ key: String(i + 1), label: this.P.languages.find((x) => x.code === l).label })) });
    }
    _subject(pre = []) {
      const L = this.L;
      return prompt(L, [...pre, { text: t(L, 'subject') }], { phase: 'subject', keys: this.P.subjects.map((s, i) => ({ key: String(i + 1), label: s.label })) });
    }
    _topic(pre = []) {
      const L = this.L, T = this.P.text, tg = this.subject.targets;
      return prompt(L, [...pre, { text: t(L, 'topic') }, ...tg.map((x, i) => ({ text: `${i + 1}. ${T.skillName(x, L)}`, kind: 'option', say: t(L, 'opt', { k: i + 1, o: T.skillName(x, L) }) }))],
        { phase: 'topic', keys: tg.map((x, i) => ({ key: String(i + 1), label: T.skillName(x, L) })) });
    }
    _question(pre = []) {
      const L = this.L, T = this.P.text, n = this.D.next();
      if (!n) return this._finish(pre);
      const q = n.question;
      return prompt(L, [...pre, { text: `${t(L, 'q', { n: this.D.asked.length + 1 })} ${T.qText(q, L)}`, kind: 'question', say: [t(L, 'q', { n: this.D.asked.length + 1 }), speakable(T.qText(q, L))] },
        ...q.o.map((o, i) => ({ text: `${i + 1}. ${o[0]}`, kind: 'option', say: t(L, 'opt', { k: i + 1, o: speakable(o[0]) }) }))],
        { phase: 'question', skill: n.skill, keys: q.o.map((o, i) => ({ key: String(i + 1), label: o[0] })) });
    }
    _finish(pre = []) {
      const L = this.L, T = this.P.text, r = this.D.result(), nm = (x) => T.skillName(x, L);
      this.result = { target: r.target, roots: r.roots, path: r.path, mastery: r.mastery, status: r.status, questions: r.questions, lang: L, caller: this.caller };
      const body = r.roots.length
        ? [{ text: t(L, 'found', { roots: r.roots.map(nm).join(' and ') }), kind: 'result' }, { text: t(L, 'path', { path: r.path.map(nm).join(', then ') }) }]
        : [{ text: t(L, 'nogap', { topic: nm(r.target) }), kind: 'result' }];
      this.phase = 'done';
      return prompt(L, [...pre, ...body, { text: t(L, 'plan') }, { text: t(L, 'bye') }], { phase: 'done', end: true, result: this.result });
    }
    /** Handle one key press. Returns the next prompt. */
    press(key) {
      key = String(key).trim();
      if (this.phase === 'done') return this.last;
      if (key === '*') return this.last;
      const n = Number(key) - 1;
      const bad = () => ({ ...this.last, segments: [t(this.L, 'invalid'), ...this.last.segments], say: t(this.L, 'invalid') + ' ' + this.last.say, lines: [{ text: t(this.L, 'invalid'), kind: 'feedback' }, ...this.last.lines] });
      if (!Number.isInteger(n) || !this.last.keys[n]) return bad();
      this.log.push({ phase: this.phase, key });
      let next;
      if (this.phase === 'lang') {
        this.L = LANGS[n];
        next = this._subject(this.L === 'en' ? [] : [{ text: t(this.L, 'hi') }]);
        this.phase = 'subject';
      } else if (this.phase === 'subject') {
        this.subject = this.P.subjects[n];
        next = this._topic();
        this.phase = 'topic';
      } else if (this.phase === 'topic') {
        this.target = this.subject.targets[n];
        this.D = new Diagnosis(this.target, this.P.graph, this.P.bank);
        this.phase = 'question';
        next = this._question([{ text: t(this.L, 'intro') }]);
      } else {
        const r = this.D.answer(n), T = this.P.text;
        const fb = r.correct ? [{ text: t(this.L, 'right'), kind: 'right' }] : [{ text: t(this.L, 'wrong') + (r.misconception ? ' ' + T.fix(r.misconception, this.L) : ''), kind: 'wrong', say: [t(this.L, 'wrong'), r.misconception ? speakable(T.fix(r.misconception, this.L)) : ''] }];
        next = this._question(fb);
        next.answered = { correct: r.correct, misconception: r.misconception };
      }
      return (this.last = next);
    }
    /** Live view of the AI's reasoning, for the skill map. */
    state() {
      if (!this.D) return null;
      return { target: this.target, status: { ...this.D.status }, mastery: { ...this.D.p }, current: this.D.cur };
    }
  }

  // The weekly check-in call RootPath makes to the student (proactive tutoring).
  class CheckInCall {
    constructor({ pack = P0, lang = 'en', name = 'Learner', skill, p0 = 0.3, maxQ = 3 }) {
      Object.assign(this, { P: pack, L: lang, name, skill, p0, maxQ, n: 0, pr: new Practice(skill, p0, pack.bank), last: null, done: false });
    }
    start() {
      const L = this.L, nm = this.P.text.skillName(this.skill, L);
      return (this.last = this._q([{ text: t(L, 'checkHi', { name: this.name, skill: nm }) }, { text: t(L, 'lesson', { lesson: this.P.text.lesson(this.skill, L) }) }]));
    }
    _q(pre) {
      const L = this.L, q = this.n < this.maxQ ? this.pr.next() : null;
      if (!q) {
        this.done = true;
        const nm = this.P.text.skillName(this.skill, L);
        return prompt(L, [...pre, { text: t(L, 'checkDone', { skill: nm, a: Math.round(this.p0 * 100), b: Math.round(this.pr.p * 100) }), kind: 'result' }, { text: t(L, 'bye') }], { phase: 'done', end: true, before: this.p0, after: this.pr.p });
      }
      this.q = q;
      return prompt(L, [...pre, { text: `${t(L, 'q', { n: this.n + 1 })} ${this.P.text.qText(q, L)}`, kind: 'question', say: [t(L, 'q', { n: this.n + 1 }), speakable(this.P.text.qText(q, L))] },
        ...q.o.map((o, i) => ({ text: `${i + 1}. ${o[0]}`, kind: 'option', say: t(L, 'opt', { k: i + 1, o: speakable(o[0]) }) }))],
        { phase: 'question', skill: this.skill, keys: q.o.map((o, i) => ({ key: String(i + 1), label: o[0] })) });
    }
    press(key) {
      if (this.done) return this.last;
      if (key === '*') return this.last;
      const n = Number(key) - 1;
      if (!Number.isInteger(n) || !this.last.keys[n]) return { ...this.last, segments: [t(this.L, 'invalid'), ...this.last.segments], say: t(this.L, 'invalid') + ' ' + this.last.say };
      const r = this.pr.answer(n);
      this.n++;
      const fb = r.correct ? [{ text: t(this.L, 'right'), kind: 'right' }] : [{ text: t(this.L, 'wrong') + (r.misconception ? ' ' + this.P.text.fix(r.misconception, this.L) : ''), kind: 'wrong', say: [t(this.L, 'wrong'), r.misconception ? speakable(this.P.text.fix(r.misconception, this.L)) : ''] }];
      return (this.last = this._q(fb));
    }
  }

  const api = { CallSession, CheckInCall, speakable, LANGS, VOICE, SAY };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RootPathCall = api;
})(typeof self !== 'undefined' ? self : this);
