import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tokenize, chunkMarkdown, buildIndex, search, extractiveAnswer } from '../public/js/rag.js';

const { chunks } = JSON.parse(readFileSync(new URL('../public/data/curriculum.json', import.meta.url)));
const index = buildIndex(chunks);

test('tokenize lowercases, strips tone marks and stopwords, stems plurals', () => {
  assert.deepEqual(tokenize('What are the Plants growing?'), ['plant', 'grow']);
  assert.deepEqual(tokenize('Ẹ̀kọ́'), ['eko']);
});

test('chunkMarkdown reads subject, topic and level', () => {
  const c = chunkMarkdown('# Physics\n\n## Heat\nLevel: SS1\n\nHeat flows from hot to cold.');
  assert.equal(c.length, 1);
  assert.equal(c[0].subject, 'Physics');
  assert.equal(c[0].topic, 'Heat');
  assert.equal(c[0].level, 'SS1');
  assert.match(c[0].text, /hot to cold/);
});

test('long sections are split into several chunks', () => {
  const para = 'word '.repeat(100).trim() + '.';
  const c = chunkMarkdown(`# X\n## Long\n${para}\n\n${para}\n\n${para}`);
  assert.equal(c.length, 3);
  assert.notEqual(c[0].id, c[1].id);
});

const cases = [
  ['what is photosynthesis', 'Photosynthesis'],
  ['how do I calculate profit percent', 'Percentages and Profit and Loss'],
  ['abeg explain ohms law', "Electric Current and Ohm's Law"],
  ['what causes malaria', 'Malaria and Disease Vectors'],
  ['solve a quadratic equation', 'Quadratic Equations'],
  ['difference between plant and animal cell', 'The Cell'],
  ['how to separate chaff from grain', 'Separation Techniques'],
];
for (const [q, topic] of cases) {
  test(`search finds "${topic}" for "${q}"`, () => {
    assert.equal(search(index, q, { k: 1 })[0]?.topic, topic);
  });
}

test('subject filter restricts results', () => {
  const r = search(index, 'energy', { k: 5, subject: 'Biology' });
  assert.ok(r.length > 0);
  assert.ok(r.every((x) => x.subject === 'Biology'));
});

test('no results for empty or stopword-only queries', () => {
  assert.deepEqual(search(index, ''), []);
  assert.deepEqual(search(index, 'what is the'), []);
});

test('extractiveAnswer returns matching textbook sentences', () => {
  const q = 'what is the vector of malaria';
  const a = extractiveAnswer(q, search(index, q, { k: 2 }));
  assert.match(a, /Anopheles/);
});
