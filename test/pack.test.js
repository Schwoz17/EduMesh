const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../src/pack');
const { Practice, simulate, bkt } = require('../src/engine');
const { ussd, gsm, LANGS } = require('../src/ussd');
const R = require('../src/router');
const { skills, graph: g, bank, text: T, misconceptions } = P;

test('merged graph: acyclic, levels ordered, 16 skills, every skill has 3 questions', () => {
  assert.equal(skills.length, 26);
  skills.forEach((s) => { assert.ok(!g.below[s.id].has(s.id)); s.pre.forEach((p) => { assert.ok(g.by[p], s.id + '->' + p); assert.ok(g.by[p].lvl <= s.lvl); }); assert.equal(bank.filter((q) => q.s === s.id).length, 3, s.id); });
  bank.forEach((q) => { assert.equal(q.o.filter((o) => o[1]).length, 1, q.id); assert.ok(q.o.some((o) => o[2]), q.id + ' needs a misconception option'); q.o.forEach((o) => o[2] && assert.ok(misconceptions[o[2]], o[2])); });
});
test('Pidgin and lessons cover every skill and misconception', () => {
  skills.slice(0, 16).forEach((s) => assert.ok(require('../src/pcm').name[s.id], s.id)); skills.forEach((s) => assert.ok(T.lesson(s.id, 'en') && T.lesson(s.id, 'pcm'), s.id));
  Object.keys(require('../src/pcm').fix).forEach((m) => assert.notEqual(T.fix(m, 'pcm'), T.fix(m, 'en'), m));
  assert.equal(T.qText(bank.find((q) => q.id === 'word1'), 'pcm').includes('chop'), true);
});
const cases = [['leqf', ['equiv'], ['equiv', 'addu', 'leqf']], ['leqf', ['ints'], ['ints', 'solve1', 'leqf']], ['leqf', ['frac'], ['frac', 'equiv', 'addl', 'addu', 'leqf']], ['solve2', ['like'], ['like', 'solve2']]];
for (const [t, gaps, path] of cases) test(`cross-topic: ${t} with gap ${gaps} -> ${path.join('>')}`, () => { const r = simulate(t, gaps, g, bank).result(); assert.deepEqual(r.roots, gaps); assert.deepEqual(r.path, path); });
test('every target x single prerequisite gap is found exactly', () => {
  for (const t of skills) for (const gap of g.below[t.id]) assert.deepEqual(simulate(t.id, [gap], g, bank).result().roots, [gap], `${t.id}/${gap}`);
});

test('practice: correct answers reach mastery from a weak start; wrong answers stop at 5 items', () => {
  const pr = new Practice('equiv', 0.04, bank); let n = 0;
  while (pr.next()) { pr.answer(pr.q.o.findIndex((o) => o[1])); n++; }
  assert.ok(pr.p >= 0.9 && n <= 4, `p=${pr.p} n=${n}`);
  const bad = new Practice('equiv', 0.5, bank);
  while (bad.next()) bad.answer(bad.q.o.findIndex((o) => !o[1]));
  assert.equal(bad.n, 5); assert.ok(bad.p < 0.5);
});

function drive(lang, target, pick, subj = 1) {
  let text = `${lang}*${subj}*${target}`;
  for (let i = 0; i < 80; i++) {
    const s = ussd(text);
    assert.ok(s.length <= 182, `screen too long (${s.length}): ${s}`); assert.match(s, /^[\x20-\x7E\n]*$/, 'USSD screen must be plain ASCII: ' + s);
    if (s.startsWith('END')) return s;
    const first = s.slice(4).split('\n')[0];
    const q = bank.find((b) => gsm(T.qText(b, LANGS[+lang - 1])) === first);
    assert.ok(q, 'question not found: ' + first);
    text += '*' + (pick(q) + 1);
  }
  throw new Error('USSD did not finish');
}
test('USSD menus and validation', () => {
  assert.match(ussd(''), /^CON RootPath\n1 English\n2 Pidgin/);
  assert.match(ussd('2'), /^CON Which subject/);
  assert.match(ussd('1'), /^CON Subject/);
  for (const bad of ['9', '1*9', '1*1*7', '1*1*x', '1*2*4']) assert.equal(ussd(bad), 'END Invalid choice', bad);
});
test('USSD full sessions in both languages, all targets, screens <= 182 chars', () => {
  for (const lang of ['1', '2', '3', '4', '5']) for (let t = 1; t <= 5; t++) {
    assert.ok(!drive(lang, t, (q) => q.o.findIndex((o) => o[1])).includes('\n'));
    assert.ok(drive(lang, t, (q) => q.o.findIndex((o) => !o[1] && o[2])).includes('\n'));
  }
});

test('review gate serves only reviewed AI content', () => {
  assert.deepEqual(R.servable([{ key: 'a', reviewed: true }, { key: 'b', reviewed: false }, { key: 'c' }]).map((x) => x.key), ['a']);
});
test('answer routing: cache > local > cloud(online) > queue', () => {
  const q = { key: 'k' };
  assert.equal(R.route(q, { cache: { k: 'x' }, local: () => 'l' }).via, 'cache');
  assert.equal(R.route(q, { local: () => 'l', cloud: () => 'c', online: true }).via, 'local');
  assert.equal(R.route(q, { local: () => null, cloud: () => 'c', online: true }).via, 'cloud');
  assert.equal(R.route(q, { local: () => null, cloud: () => 'c', online: false }).via, 'queue');
});
test('SMS progress code round-trips within rounding', () => {
  const m = { equiv: 0.04, frac: 0.92 }, code = R.smsEncode(m);
  assert.equal(code, 'RP1 equiv:04,frac:91'); const back = R.smsDecode(code);
  assert.ok(Math.abs(back.frac - 0.92) < 0.01); assert.throws(() => R.smsDecode('hello')); assert.ok(code.length <= 160);
});
test('field-test agreement metric ignores unrated learners', () => {
  const a = R.agreement([{ roots: ['equiv'], teacherRoots: ['equiv'] }, { roots: ['mult'], teacherRoots: ['div'] }, { roots: ['frac'], teacherRoots: null }]);
  assert.deepEqual([a.total, a.rated, a.matched, a.rate], [3, 2, 1, 0.5]);
});

module.exports = { drive };
