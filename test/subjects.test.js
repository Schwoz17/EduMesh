const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../src/pack');
const { simulate } = require('../src/engine');
const { ussd, gsm, LANGS } = require('../src/ussd');
const { skills, graph: g, bank, text: T, misconceptions } = P;
const PH = require('../src/physics'), EN = require('../src/english');

test('physics and english packs: 3 questions per skill, one correct option, known misconceptions, lessons', () => {
  for (const pk of [PH, EN]) {
    pk.skills.forEach((s) => { assert.equal(pk.bank.filter((q) => q.s === s.id).length, 3, s.id); assert.ok(pk.lessons[s.id], 'lesson ' + s.id); });
    pk.bank.forEach((q) => { assert.equal(q.o.filter((o) => o[1]).length, 1, q.id); assert.ok(q.o.some((o) => o[2]), q.id); q.o.forEach((o) => o[2] && assert.ok(misconceptions[o[2]], o[2])); });
  }
  const ids = skills.map((s) => s.id); assert.equal(new Set(ids).size, ids.length, 'skill ids must be unique');
  assert.equal(new Set(bank.map((q) => q.id)).size, bank.length, 'question ids must be unique');
});
test('subjects reference real skills', () => P.subjects.forEach((s) => s.targets.forEach((t) => assert.ok(g.by[t], t))));
const cases = [
  ['spdf', ['div'], ['div', 'frac', 'speed', 'fofq', 'spdf']],   // a physics failure traced to a Primary 3 maths gap
  ['spdf', ['frac'], ['frac', 'fofq', 'spdf']],
  ['work', ['mult'], ['mult', 'force', 'work']],
  ['speed', ['unit'], ['unit', 'speed']],
  ['cond', ['tense'], ['tense', 'cond']],
  ['cond', ['noun'], ['noun', 'subv', 'tense', 'cond']],
];
for (const [t, gaps, path] of cases) test(`cross-subject: ${t} with gap ${gaps}`, () => { const r = simulate(t, gaps, g, bank).result(); assert.deepEqual(r.roots, gaps); assert.deepEqual(r.path, path); });

test('USSD: subject menu, then topics per subject, every screen plain ASCII <= 182 chars, all languages', () => {
  assert.match(ussd('1'), /^CON Subject\n1 Maths\n2 Physics\n3 English/);
  P.subjects.forEach((S, si) => { for (let l = 1; l <= 5; l++) S.targets.forEach((tg, ti) => {
    for (const pick of ['right', 'wrong']) {
      let text = `${l}*${si + 1}*${ti + 1}`;
      for (let i = 0; i < 80; i++) {
        const s = ussd(text); assert.ok(s.length <= 182 && /^[\x20-\x7E\n]*$/.test(s), s);
        if (s.startsWith('END')) { assert.equal(s.includes('\n'), pick === 'wrong', `${S.id}/${tg}/${pick}: ${s}`); break; }
        const q = bank.find((b) => gsm(T.qText(b, LANGS[l - 1])) === s.slice(4).split('\n')[0]); assert.ok(q);
        text += '*' + ((pick === 'right' ? q.o.findIndex((o) => o[1]) : q.o.findIndex((o) => !o[1] && o[2])) + 1);
      }
    }
  }); });
});
