// RootPath engine: BKT mastery + root-cause search. Pure JS, no dependencies, runs offline.
(function (root) {
  const PARAMS = { start: 0.5, slip: 0.15, guess: 0.25, learn: 0.2, mastered: 0.9, weak: 0.15, maxQ: 3 };

  function bkt(p, correct, k = PARAMS) {
    const num = correct ? p * (1 - k.slip) : p * k.slip;
    const den = num + (1 - p) * (correct ? k.guess : 1 - k.guess);
    return num / den;
  }
  const learnStep = (p, k = PARAMS) => p + (1 - p) * k.learn;

  function makeGraph(skills) {
    const by = Object.fromEntries(skills.map((s, i) => [s.id, { ...s, order: i }]));
    const below = {}, above = {};
    skills.forEach((s) => { below[s.id] = new Set(); above[s.id] = new Set(); });
    const walk = (id, seen) => by[id].pre.forEach((p) => { if (!seen.has(p)) { seen.add(p); walk(p, seen); } });
    skills.forEach((s) => walk(s.id, below[s.id]));
    skills.forEach((s) => below[s.id].forEach((b) => above[b].add(s.id)));
    return { skills, by, below, above };
  }

  class Diagnosis {
    constructor(target, graph, bank) {
      if (!graph.by[target]) throw new Error('Unknown target skill: ' + target);
      Object.assign(this, { target, g: graph, bank, status: {}, p: {}, n: {}, asked: [], mis: {}, cur: null, q: null });
    }
    _candidates() {
      const C = new Set();
      for (const w in this.status) if (this.status[w] === 'W') this.g.below[w].forEach((b) => { if (!this.status[b]) C.add(b); });
      return C;
    }
    nextSkill() {
      const { status, target, g } = this;
      if (!status[target]) return target;
      if (status[target] === 'M') return null;
      const C = this._candidates();
      if (!C.size) return null;
      let best = null, bs = -1;
      for (const c of C) {
        const lo = [...g.below[c]].filter((x) => C.has(x)).length;
        const hi = [...g.above[c]].filter((x) => C.has(x)).length;
        const score = Math.min(lo, hi) + 1;
        if (score > bs || (score === bs && g.by[c].lvl > g.by[best].lvl)) { bs = score; best = c; }
      }
      return best;
    }
    next() {
      if (this.q) return { skill: this.cur, question: this.q };
      if (!this.cur || this.status[this.cur]) this.cur = this.nextSkill();
      if (!this.cur) return null;
      this.q = this.bank.find((q) => q.s === this.cur && !this.asked.includes(q.id));
      return this.q ? { skill: this.cur, question: this.q } : null;
    }
    answer(optIndex) {
      const { cur: s, q } = this;
      const opt = q.o[optIndex];
      const ok = !!opt[1];
      this.asked.push(q.id);
      this.p[s] = bkt(this.p[s] ?? PARAMS.start, ok);
      this.n[s] = (this.n[s] || 0) + 1;
      if (!ok && opt[2]) (this.mis[opt[2]] = this.mis[opt[2]] || []).push(s);
      this.q = null;
      const P = this.p[s];
      if (P >= PARAMS.mastered) this._decide(s, 'M');
      else if (P <= PARAMS.weak) this._decide(s, 'W');
      else if (this.n[s] >= PARAMS.maxQ) this._decide(s, P >= 0.5 ? 'M' : 'W');
      return { correct: ok, misconception: opt[2] || null };
    }
    _decide(s, st) {
      this.status[s] = st;
      const spread = st === 'M' ? this.g.below[s] : this.g.above[s];
      spread.forEach((x) => { if (!this.status[x]) this.status[x] = st === 'M' ? 'iM' : 'iW'; });
    }
    get done() { return this.next() === null; }
    roots() {
      const ok = (x) => this.status[x] === 'M' || this.status[x] === 'iM';
      return this.g.skills.filter((s) => this.status[s.id] === 'W' && s.pre.every(ok)).map((s) => s.id);
    }
    path() {
      const keep = new Set();
      const upTo = new Set([this.target, ...this.g.below[this.target]]);
      this.roots().forEach((r) => [r, ...this.g.above[r]].forEach((s) => {
        if (upTo.has(s) && this.status[s] !== 'M' && this.status[s] !== 'iM') keep.add(s);
      }));
      return [...keep].sort((a, b) => this.g.by[a].lvl - this.g.by[b].lvl || this.g.by[a].order - this.g.by[b].order);
    }
    result() {
      return { target: this.target, roots: this.roots(), path: this.path(), status: { ...this.status }, mastery: { ...this.p }, mis: this.mis, questions: this.asked.length };
    }
  }

  // Simulated student: knows a skill only if it and every prerequisite are outside `gaps`; else picks a misconception option.
  function simulate(target, gaps, graph, bank) {
    const knows = (s) => !gaps.includes(s) && ![...graph.below[s]].some((b) => gaps.includes(b));
    const d = new Diagnosis(target, graph, bank);
    for (let step = 0; step < 100; step++) {
      const n = d.next();
      if (!n) break;
      const o = n.question.o;
      const idx = knows(n.skill) ? o.findIndex((x) => x[1]) : Math.max(0, o.findIndex((x) => !x[1] && x[2]));
      d.answer(idx);
    }
    return d;
  }

  // Practice round: learning-aware updates until mastery (max 5 items).
  class Practice {
    constructor(skill, p0, bank) { Object.assign(this, { skill, p: p0, n: 0, q: null, items: bank.filter((x) => x.s === skill) }); }
    get done() { return this.p >= PARAMS.mastered || this.n >= 5; }
    next() { if (this.done) return null; this.q = this.items[this.n % this.items.length]; return this.q; }
    answer(i) { const o = this.q.o[i], ok = !!o[1]; this.p = learnStep(bkt(this.p, ok)); this.n++; return { correct: ok, misconception: o[2] || null }; }
  }

  const api = { PARAMS, bkt, learnStep, makeGraph, Diagnosis, Practice, simulate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RootPathEngine = api;
})(typeof self !== 'undefined' ? self : this);
