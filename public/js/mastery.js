// Predictive mastery layer + behavioural learner profile.
// Everything is computed and stored on the student's own device (localStorage):
// no student data ever leaves the phone.

/** Least-squares linear regression over scores indexed 0..n-1. */
export function linearRegression(scores) {
  const n = scores.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: 0, intercept: scores[0] };
  let xSum = 0, ySum = 0, xySum = 0, xxSum = 0;
  for (let i = 0; i < n; i++) {
    xSum += i;
    ySum += scores[i];
    xySum += i * scores[i];
    xxSum += i * i;
  }
  const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
  const intercept = (ySum - slope * xSum) / n;
  return { slope, intercept };
}

/** Predict the next score (0–100), using at most the last `window` attempts. */
export function predictNext(scores, window = 8) {
  const recent = scores.slice(-window);
  if (recent.length < 2) return null;
  const { slope, intercept } = linearRegression(recent);
  const raw = slope * recent.length + intercept;
  return { predicted: Math.round(Math.max(0, Math.min(100, raw))), slope };
}

export function tierFor(predicted) {
  if (predicted == null) return 'standard';
  if (predicted < 50) return 'foundation';
  if (predicted >= 75) return 'advanced';
  return 'standard';
}

const KEY = 'edumesh.profile.v1';
const STREAK_TO_ADAPT = 3;

function emptyProfile() {
  return {
    preferredDialect: null,
    dialectStreak: { dialect: null, count: 0 },
    voiceStreak: 0,
    voiceFirst: false,
    lowVision: false,
    quizzes: {}, // subject -> [percent, ...]
    topics: {}, // "Subject|Topic" -> { right, total }
  };
}

export class LearnerProfile {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.data = emptyProfile();
    try {
      const raw = storage && storage.getItem(KEY);
      if (raw) this.data = { ...emptyProfile(), ...JSON.parse(raw) };
    } catch {
      /* corrupted profile: start fresh */
    }
  }

  save() {
    try {
      this.storage && this.storage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* storage full or unavailable: keep in memory */
    }
  }

  /**
   * Record one question. Returns what changed so the UI can announce it:
   * { dialectAdopted?: string, voiceFirstEnabled?: boolean }
   */
  recordQuestion({ dialect, inputType }) {
    const changes = {};
    const s = this.data.dialectStreak;
    if (s.dialect === dialect) s.count += 1;
    else {
      s.dialect = dialect;
      s.count = 1;
    }
    if (s.count >= STREAK_TO_ADAPT && this.data.preferredDialect !== dialect) {
      this.data.preferredDialect = dialect;
      changes.dialectAdopted = dialect;
    }

    if (inputType === 'voice') this.data.voiceStreak += 1;
    else this.data.voiceStreak = 0;
    if (this.data.voiceStreak >= STREAK_TO_ADAPT && !this.data.voiceFirst) {
      this.data.voiceFirst = true;
      changes.voiceFirstEnabled = true;
    }
    this.save();
    return changes;
  }

  /**
   * subject: the quiz's subject ("all" for a mixed quiz) — the score trend is stored under it.
   * results: [{ topic, correct: boolean, subject? }] — topic stats use each question's own subject.
   */
  recordQuiz(subject, results) {
    if (!results.length) return null;
    const right = results.filter((r) => r.correct).length;
    const percent = Math.round((right / results.length) * 100);
    (this.data.quizzes[subject] ||= []).push(percent);
    for (const r of results) {
      const key = `${r.subject || subject}|${r.topic}`;
      const t = (this.data.topics[key] ||= { right: 0, total: 0 });
      t.total += 1;
      if (r.correct) t.right += 1;
    }
    this.save();
    return percent;
  }

  allScores() {
    // Interleave in recorded order is not tracked across subjects; overall trend = concatenation.
    return Object.values(this.data.quizzes).flat();
  }

  scores(subject) {
    if (!subject || subject === 'all') return this.allScores();
    return this.data.quizzes[subject] || [];
  }

  prediction(subject) {
    return predictNext(this.scores(subject));
  }

  tier(subject) {
    const p = this.prediction(subject);
    return tierFor(p ? p.predicted : null);
  }

  /** Topics answered at least twice with under 50% correct, weakest first. */
  weakTopics(subject, { minAttempts = 2, threshold = 0.5 } = {}) {
    return Object.entries(this.data.topics)
      .filter(([key, t]) => (!subject || subject === 'all' || key.startsWith(subject + '|')) && t.total >= minAttempts && t.right / t.total < threshold)
      .sort((a, b) => a[1].right / a[1].total - b[1].right / b[1].total)
      .map(([key, t]) => ({ subject: key.split('|')[0], topic: key.split('|')[1], percent: Math.round((t.right / t.total) * 100) }));
  }

  set(field, value) {
    this.data[field] = value;
    this.save();
  }

  reset() {
    this.data = emptyProfile();
    this.save();
  }
}
