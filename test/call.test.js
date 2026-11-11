const test = require('node:test');
const assert = require('node:assert');
const P = require('../src/pack');
const { CallSession, CheckInCall, speakable } = require('../src/call');
const { resultSms, dailySms, replySms, reportSms } = require('../src/sms');
const { groupByRoot, fromCode, demoClass } = require('../src/classroom');
const { toXml, createHandler } = require('../tools/at-voice');

// Answer like a learner whose only gap is `gap`: wrong on that skill and everything above it.
function weakOn(gap) {
  return (s) => {
    const n = s.D.next(), o = n.question.o;
    const weak = n.skill === gap || P.graph.below[n.skill].has(gap);
    return weak ? Math.max(0, o.findIndex((x) => !x[1] && x[2])) + 1 : o.findIndex((x) => x[1]) + 1;
  };
}
function runCall({ lang = 2, subject = 1, topic = 5, gap = 'equiv' } = {}) {
  const s = new CallSession({ caller: 'Tunde' });
  let p = s.start();
  assert.match(p.say, /press 1/i);
  p = s.press(String(lang));
  p = s.press(String(subject));
  p = s.press(String(topic));
  const pick = weakOn(gap);
  let guard = 0;
  while (!p.end && guard++ < 60) p = s.press(String(pick(s)));
  return { s, p };
}

test('speakable reads maths aloud', () => {
  assert.equal(speakable('1/2 = ?/8'), '1 over 2 equals what over 8');
  assert.equal(speakable('x + 1/2 = 3/4. x = ?'), 'x plus 1 over 2 equals 3 over 4. x equals what?');
  assert.equal(speakable('6 × 7 = ?'), '6 times 7 equals what?');
  assert.equal(speakable('4 − 7'), '4 minus 7');
  assert.equal(speakable('Use the opposite: + with −, × with ÷.'), 'Use the opposite: plus with minus, times with divided by.');
});

test('a full Pidgin call finds Tunde\'s root gap and ends with a plan', () => {
  const { s, p } = runCall();
  assert.equal(p.end, true);
  assert.deepEqual(p.result.roots, ['equiv']);
  assert.equal(p.result.lang, 'pcm');
  assert.match(p.say, /wahala start/);
  assert.match(p.say, /SMS/);
  assert.ok(p.result.questions <= 15);
  assert.equal(s.state().status.equiv, 'W');
});

test('every question offers spoken key options and the AI state is visible', () => {
  const s = new CallSession();
  s.start(); s.press('1'); s.press('1');
  const p = s.press('5');
  assert.equal(p.phase, 'question');
  assert.equal(p.keys.length, 4);
  assert.match(p.say, /Press 1 for/);
  assert.equal(s.state().target, 'leqf');
});

test('wrong answers explain the misconception; invalid keys and * repeat', () => {
  const s = new CallSession();
  s.start(); s.press('1'); s.press('1');
  let p = s.press('5');
  const wrongKey = p.keys.findIndex((k, i) => !s.D.q.o[i][1] && s.D.q.o[i][2]) + 1;
  const before = p;
  assert.equal(s.press('9').say.startsWith('Sorry'), true);
  assert.deepEqual(s.press('*'), before);
  p = s.press(String(wrongKey));
  assert.equal(p.answered.correct, false);
  assert.match(p.lines[0].text, /^Not quite\. ./);
});

test('no-gap learners are congratulated', () => {
  const s = new CallSession();
  s.start(); s.press('1'); s.press('1');
  let p = s.press('5');
  while (!p.end) p = s.press(String(s.D.q.o.findIndex((x) => x[1]) + 1));
  assert.deepEqual(p.result.roots, []);
  assert.match(p.say, /No gap found/);
});

test('weekly check-in call practises the root skill and reports the gain', () => {
  const c = new CheckInCall({ name: 'Tunde', skill: 'equiv', p0: 0.04, lang: 'pcm' });
  let p = c.start();
  assert.match(p.say, /Tunde/);
  while (!p.end) p = c.press(String(c.q.o.findIndex((x) => x[1]) + 1));
  assert.ok(p.after > p.before);
  assert.match(p.say, /percent/);
});

test('SMS: result, daily question, replies and report fit basic phones', () => {
  const { p } = runCall({ lang: 1 });
  const r = resultSms({ name: 'Tunde', result: p.result });
  assert.match(r, /Equivalent fractions/);
  assert.ok(/^[\x00-\x7F\n]*$/.test(r), 'GSM-safe ASCII');
  const d = dailySms({ skill: 'equiv', day: 2 });
  assert.match(d.text, /Reply A, B, C or D/);
  const good = 'ABCD'[d.question.o.findIndex((x) => x[1])];
  const ok = replySms({ question: d.question, reply: good.toLowerCase(), p: 0.3 });
  assert.equal(ok.correct, true);
  assert.ok(ok.p > 0.3);
  const badIdx = d.question.o.findIndex((x) => !x[1]);
  const no = replySms({ question: d.question, reply: String(badIdx + 1), p: 0.3 });
  assert.equal(no.correct, false);
  assert.match(no.text, /Answer: [A-D]/);
  assert.equal(replySms({ question: d.question, reply: 'hello' }).valid, false);
  const rep = reportSms({ name: 'Tunde', result: p.result, skill: 'equiv', before: 0.04, after: 0.8, days: 5 });
  assert.match(rep, /4% -> 80%/);
  assert.match(rep, /RP1 /);
});

test('classroom groups learners by root gap, including from SMS codes', () => {
  const cls = demoClass({ size: 30 });
  assert.equal(cls.length, 30);
  assert.deepEqual(demoClass({ size: 30 }).map((r) => r.roots), cls.map((r) => r.roots), 'deterministic');
  const g = groupByRoot(cls);
  assert.equal(g.total, 30);
  assert.equal(g.groups.reduce((s, x) => s + x.count, 0) + g.noGap.length, 30);
  assert.ok(g.groups[0].count >= g.groups.at(-1).count);
  const fc = fromCode('Ada', 'RP1 equiv:04,frac:91,lcm:91,leqf:04,addu:10');
  assert.deepEqual(fc.roots, ['equiv']);
});

test('Africa\'s Talking adapter speaks the same call over real phone lines', () => {
  const handle = createHandler({ callbackUrl: 'https://example.org/voice' });
  let out = handle({ sessionId: 's1', isActive: '1', callerNumber: '+2348000000000' });
  assert.match(out.body, /<GetDigits[^>]*numDigits="1"[^>]*callbackUrl="https:\/\/example.org\/voice"><Say>Welcome to RootPath/);
  out = handle({ sessionId: 's1', isActive: '1', dtmfDigits: '2' });
  assert.match(out.body, /Which subject/);
  assert.equal(handle({ sessionId: 's1', isActive: '0' }).body, '');
  assert.equal(handle({}).status, 400);
  assert.match(toXml({ end: true, say: 'Bye <now>' }), /<Say>Bye &lt;now&gt;<\/Say><\/Response>$/);
});
