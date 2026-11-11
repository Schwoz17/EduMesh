const test = require('node:test');
const assert = require('node:assert/strict');
const { skills, misconceptions, bank } = require('../src/content');
const { PARAMS, bkt, learnStep, makeGraph, Diagnosis, simulate } = require('../src/engine');
const g = makeGraph(skills);
const near = (a, b, eps = 0.005) => assert.ok(Math.abs(a - b) < eps, `${a} !~ ${b}`);

test('BKT worked examples from the spec', () => {
  let p = bkt(0.5, true); near(p, 0.77); p = bkt(p, true); near(p, 0.92);
  p = bkt(0.5, false); near(p, 0.17); p = bkt(p, false); near(p, 0.04);
  p = bkt(0.5, true); p = bkt(p, false); near(p, 0.40); p = bkt(p, true); near(p, 0.70);
});
test('learning step raises mastery toward 1', () => { near(learnStep(0.5), 0.6); assert.ok(learnStep(0.99) < 1); });

test('content pack integrity', () => {
  assert.equal(skills.length, 11); assert.equal(bank.length, 33); assert.equal(Object.keys(misconceptions).length, 20);
  const ids = new Set(skills.map((s) => s.id));
  skills.forEach((s) => s.pre.forEach((p) => assert.ok(ids.has(p), `${s.id} -> ${p}`)));
  skills.forEach((s) => assert.equal(bank.filter((q) => q.s === s.id).length, 3, s.id));
  assert.equal(new Set(bank.map((q) => q.id)).size, bank.length);
  bank.forEach((q) => {
    assert.equal(q.o.length, 4, q.id);
    assert.equal(q.o.filter((o) => o[1]).length, 1, q.id + ' needs exactly one correct option');
    assert.equal(new Set(q.o.map((o) => o[0])).size, 4, q.id + ' has duplicate options');
    q.o.forEach((o) => o[2] && assert.ok(misconceptions[o[2]], q.id + ' unknown misconception ' + o[2]));
  });
});

test('graph is acyclic with correct transitive closures', () => {
  skills.forEach((s) => assert.ok(!g.below[s.id].has(s.id), 'cycle at ' + s.id));
  assert.deepEqual([...g.below.addu].sort(), ['addl', 'div', 'equiv', 'frac', 'lcm', 'mult']);
  assert.deepEqual([...g.above.frac].sort(), ['addl', 'addu', 'equiv', 'fofq', 'multf', 'simp', 'word']);
  skills.forEach((s) => s.pre.forEach((p) => assert.ok(g.by[p].lvl <= s.lvl)));
});

test('mastered target stops after two correct answers', () => {
  const d = simulate('addu', [], g, bank);
  assert.equal(d.result().questions, 2); assert.deepEqual(d.roots(), []); assert.equal(d.status.addu, 'M');
});
test('a single slip does not label a skill weak', () => {
  const d = new Diagnosis('mult', g, bank);
  d.next(); d.answer(0); d.next(); d.answer(1); d.next(); d.answer(0); // right, wrong, right
  assert.equal(d.status.mult, 'M');
});
test('mastery propagates down, weakness propagates up', () => {
  const d = simulate('addu', ['equiv'], g, bank);
  assert.equal(d.status.div, 'iM'); assert.equal(d.status.equiv, 'W');
  const w = new Diagnosis('word', g, bank); w._decide('frac', 'W');
  assert.equal(w.status.addu, 'iW'); assert.equal(w.status.mult, undefined);
});
test('unknown target throws', () => assert.throws(() => new Diagnosis('nope', g, bank)));

const cases = [
  ['addu', ['equiv'], ['equiv'], ['equiv', 'addu']],
  ['addu', ['mult'], ['mult'], ['mult', 'equiv', 'lcm', 'addu']],
  ['addu', ['div'], ['div'], ['div', 'frac', 'equiv', 'addl', 'addu']],
  ['addu', ['lcm', 'addl'], ['lcm', 'addl'], ['lcm', 'addl', 'addu']],
  ['word', ['equiv'], ['equiv'], ['equiv', 'addu', 'word']],
  ['word', ['frac'], ['frac'], ['frac', 'equiv', 'addl', 'addu', 'fofq', 'word']],
  ['word', ['fofq'], ['fofq'], ['fofq', 'word']],
  ['multf', ['simp'], ['simp'], ['simp', 'multf']],
];
for (const [target, gaps, roots, path] of cases) {
  test(`simulated student: ${target} with gap [${gaps}] finds root [${roots}]`, () => {
    const r = simulate(target, gaps, g, bank).result();
    assert.deepEqual([...r.roots].sort(), [...roots].sort());
    assert.deepEqual(r.path, path);
    assert.ok(r.questions <= 33 && r.questions >= 2);
  });
}

test('misconceptions are recorded from wrong answers', () => {
  const r = simulate('addu', ['equiv'], g, bank).result();
  assert.ok(r.mis.add_equiv && r.mis.add_equiv.includes('equiv'));
});
test('every skill pair of (target, single gap) yields a root inside the true gap set', () => {
  for (const t of skills) for (const gap of skills) {
    if (gap.id !== t.id && !g.below[t.id].has(gap.id)) continue;
    const r = simulate(t.id, [gap.id], g, bank).result();
    assert.deepEqual(r.roots, [gap.id], `${t.id}/${gap.id}`);
  }
});
