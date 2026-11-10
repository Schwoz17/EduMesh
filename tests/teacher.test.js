import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTeacherPack } from '../public/js/teacher.js';
import { parsePack, packChunks } from '../public/js/packs.js';

const base = { title: 'SS2 Biology Week 3', subject: 'Biology', topic: 'Transpiration', level: 'SS2', lesson: 'Transpiration is the loss of water vapour from leaves.\n\n# not a heading\nIt happens through stomata.' };

test('teacher form becomes a valid, importable pack', () => {
  const pack = buildTeacherPack(
    { ...base, questions: [{ q: 'Water leaves through the…', options: ['roots', 'stomata', 'bark', 'seed'], answer: 1, explain: '' }, { q: '   ', options: [], answer: 0 }] },
    1700000000000
  );
  assert.match(pack.id, /^ss2-biology-week-3-[a-z0-9]+$/);
  const again = parsePack(JSON.stringify(pack));
  assert.equal(again.quizzes.length, 1); // blank question skipped
  assert.equal(again.quizzes[0].subject, 'Biology');
  assert.match(again.quizzes[0].explain, /B: stomata/);
  const chunks = packChunks(again);
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].topic, 'Transpiration');
  assert.equal(chunks[0].level, 'SS2');
  assert.match(chunks[0].text, /not a heading/); // user "#" lines can't create fake topics
});

test('teacher form errors are readable', () => {
  assert.throws(() => buildTeacherPack({ ...base, title: ' ' }), /title/);
  assert.throws(() => buildTeacherPack({ ...base, topic: '' }), /topic/);
  assert.throws(() => buildTeacherPack({ ...base, lesson: '', questions: [] }), /lesson text or at least one question/);
  assert.throws(() => buildTeacherPack({ ...base, questions: [{ q: 'Q', options: ['a', '', 'c', 'd'], answer: 0 }] }), /Question 1: fill in every option/);
  assert.throws(() => buildTeacherPack({ ...base, questions: [{ q: 'Q', options: ['a', 'b', 'c', 'd'], answer: -1 }] }), /choose the correct answer/);
});

test('quiz-only packs are allowed', () => {
  const pack = buildTeacherPack({ ...base, lesson: '', questions: [{ q: 'Q?', options: ['a', 'b'], answer: 0 }] });
  assert.equal(pack.curriculum.length, 0);
  assert.equal(pack.quizzes.length, 1);
});
