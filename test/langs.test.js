const test = require('node:test');
const assert = require('node:assert/strict');
const X = require('../src/langs');
const P = require('../src/pack');
const { ussd, gsm } = require('../src/ussd');
const UIKEYS = 'sub name topic start nq next gap nogap path go lesson practice again res'.split(' ');

test('three Nigerian languages are registered and flagged as draft', () => {
  assert.deepEqual(Object.keys(X).sort(), ['ha', 'ig', 'yo']);
  for (const c of ['yo', 'ig', 'ha']) assert.equal(P.languages.find((l) => l.code === c).status, 'draft');
  assert.equal(P.languages.find((l) => l.code === 'en').status, 'reviewed');
});
test('each language has full UI + all 16 skill names and honest lesson coverage', () => {
  for (const c of ['yo', 'ig', 'ha']) {
    UIKEYS.forEach((k) => assert.ok(X[c].ui[k], `${c}.ui.${k}`));
    const cov = P.coverage(c); assert.equal(cov.names, 16 / P.skills.length); assert.equal(cov.lessons, 6 / P.skills.length);
    P.skills.forEach((s) => assert.ok(P.text.skillName(s.id, c) && P.text.lesson(s.id, c), s.id));
  }
});
test('translated strings differ from English, untranslated ones fall back to English', () => {
  assert.notEqual(P.text.lesson('equiv', 'yo'), P.text.lesson('equiv', 'en'));
  assert.equal(P.text.lesson('simp', 'ha'), P.text.lesson('simp', 'en'));
  assert.equal(P.text.skillName('equiv', 'xx'), 'Equivalent fractions');
});
test('all strings are NFC so tone-marked text searches and renders consistently', () => {
  const walk = (v) => (typeof v === 'string' ? assert.equal(v, v.normalize('NFC')) : Object.values(v).forEach(walk));
  walk(X);
});
test('GSM folding removes tone marks and hooked letters but keeps meaning readable', () => {
  assert.equal(gsm('Ọ̀nà'), 'Ona'); assert.equal(gsm('ɓɗƙ'), 'bdk'); assert.equal(gsm('6 × 7 − 2 ÷ 1'), '6 x 7 - 2 / 1');
});
test('USSD topic menus show all five topics in every language', () => {
  for (let l = 1; l <= 5; l++) { const s = ussd(l + '*1'); assert.ok(s.length <= 182); for (let i = 1; i <= 5; i++) assert.ok(s.includes(`\n${i} `), `lang ${l} missing topic ${i}`); }
});
