const test = require('node:test');
const assert = require('node:assert');
const P = require('../src/pack');
const { CallSession } = require('../src/call');
const { clipId, VOICES } = require('../src/voice');
const { toXml } = require('../tools/at-voice');
const K = require('../src/classroom');

test('clip ids are stable, language-specific and ignore spacing', () => {
  assert.equal(clipId('pcm', 'E no correct.'), clipId('pcm', '  E no  correct. '));
  assert.notEqual(clipId('pcm', 'Correct!'), clipId('en', 'Correct!'));
  assert.match(clipId('yo', 'Ẹ káàbọ̀ sí RootPath.'), /^yo-[0-9a-f]{8}$/);
  for (const l of ['en', 'pcm', 'yo', 'ig', 'ha']) assert.ok(VOICES[l].speaker);
});

test('voice manifest covers every piece of Tunde\'s demo call (run tools/voice-lines.js if this fails)', () => {
  const have = new Set(require('../voice/manifest.json').map((r) => r.id));
  for (const lang of ['1', '2']) {
    const s = new CallSession({ caller: 'Tunde' });
    let p = s.start();
    const check = (x) => x.segments.forEach((seg) => assert.ok(have.has(clipId(x.lang, seg)), `missing clip for: ${seg}`));
    check(p);
    for (const k of [lang, '1', '5']) { p = s.press(k); check(p); }
    while (!p.end) {
      const n = s.D.next(), o = n.question.o;
      const weak = n.skill === 'equiv' || P.graph.below[n.skill].has('equiv');
      p = s.press(String((weak ? Math.max(0, o.findIndex((x) => !x[1] && x[2])) : o.findIndex((x) => x[1])) + 1));
      check(p);
    }
  }
});

test('phone line plays recorded clips and falls back to the provider voice', () => {
  const s = new CallSession();
  const p = s.start();
  const have = new Set([clipId('en', p.segments[0])]);
  const xml = toXml(p, 'https://x/voice', { base: 'https://x/voice/clips/', have });
  assert.match(xml, new RegExp(`<Play url="https://x/voice/clips/${clipId('en', p.segments[0])}\\.mp3"/><Say>For English, press 1`));
});

test('teacher gets a weekly class summary by SMS', () => {
  const msg = K.teacherSms(K.groupByRoot(K.demoClass()), 'JSS1 B');
  assert.match(msg, /^RootPath weekly: JSS1 B\n30 learners/);
  assert.match(msg, /1\) Positive and negative numbers: 9/);
  assert.match(msg, /Reply 1-4/);
  assert.ok(/^[\x00-\x7F\n]*$/.test(msg));
});
