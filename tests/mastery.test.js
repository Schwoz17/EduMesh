import { test } from 'node:test';
import assert from 'node:assert/strict';
import { linearRegression, predictNext, tierFor, LearnerProfile } from '../public/js/mastery.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

test('linear regression fits a perfect line', () => {
  const { slope, intercept } = linearRegression([40, 50, 60, 70]);
  assert.equal(slope, 10);
  assert.equal(intercept, 40);
});

test('predictNext extrapolates and clamps to 0..100', () => {
  assert.equal(predictNext([40, 50, 60, 70]).predicted, 80);
  assert.equal(predictNext([80, 90, 100]).predicted, 100);
  assert.equal(predictNext([30, 15, 0]).predicted, 0);
  assert.equal(predictNext([50]), null);
});

test('tiers follow the prediction', () => {
  assert.equal(tierFor(null), 'standard');
  assert.equal(tierFor(30), 'foundation');
  assert.equal(tierFor(60), 'standard');
  assert.equal(tierFor(90), 'advanced');
});

test('dialect becomes default after 3 consecutive questions', () => {
  const p = new LearnerProfile(memoryStorage());
  assert.deepEqual(p.recordQuestion({ dialect: 'pidgin', inputType: 'text' }), {});
  p.recordQuestion({ dialect: 'english', inputType: 'text' }); // breaks the streak
  p.recordQuestion({ dialect: 'pidgin', inputType: 'text' });
  p.recordQuestion({ dialect: 'pidgin', inputType: 'text' });
  assert.equal(p.data.preferredDialect, null);
  assert.deepEqual(p.recordQuestion({ dialect: 'pidgin', inputType: 'text' }), { dialectAdopted: 'pidgin' });
  assert.equal(p.data.preferredDialect, 'pidgin');
});

test('voice-first turns on after 3 voice questions in a row', () => {
  const p = new LearnerProfile(memoryStorage());
  p.recordQuestion({ dialect: 'english', inputType: 'voice' });
  p.recordQuestion({ dialect: 'english', inputType: 'voice' });
  const c = p.recordQuestion({ dialect: 'english', inputType: 'voice' });
  assert.equal(c.voiceFirstEnabled, true);
  assert.equal(p.data.voiceFirst, true);
});

test('quiz results drive scores, weak topics and persistence', () => {
  const store = memoryStorage();
  const p = new LearnerProfile(store);
  const r = (topic, correct) => ({ topic, correct });
  assert.equal(p.recordQuiz('Biology', [r('Photosynthesis', false), r('Photosynthesis', false), r('The Cell', true), r('The Cell', true)]), 50);
  p.recordQuiz('Biology', [r('Photosynthesis', true), r('The Cell', true)]);
  assert.deepEqual(p.scores('Biology'), [50, 100]);
  assert.deepEqual(p.weakTopics('Biology').map((w) => w.topic), ['Photosynthesis']);
  assert.equal(p.weakTopics('Physics').length, 0);
  const reloaded = new LearnerProfile(store);
  assert.deepEqual(reloaded.scores('Biology'), [50, 100]);
  assert.equal(reloaded.prediction('Biology').predicted, 100);
});

test('mixed quizzes record topics under each question subject', () => {
  const p = new LearnerProfile(memoryStorage());
  p.recordQuiz('all', [
    { subject: 'Physics', topic: 'Heat and Temperature', correct: false },
    { subject: 'Physics', topic: 'Heat and Temperature', correct: false },
  ]);
  assert.equal(p.weakTopics('Physics')[0].topic, 'Heat and Temperature');
  assert.deepEqual(p.scores('all'), [0]);
});

test('corrupted storage starts a fresh profile', () => {
  const s = memoryStorage();
  s.setItem('edumesh.profile.v1', '{not json');
  assert.deepEqual(new LearnerProfile(s).scores('all'), []);
});
