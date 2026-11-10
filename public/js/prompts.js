// Dialect steering + complexity tiers + prompt assembly.
// The same small model speaks five "modes" purely through system-prompt instructions,
// so no extra language files are ever downloaded.

export const DIALECTS = {
  english: {
    label: 'Standard English',
    short: 'English',
    flag: '🇬🇧',
    instruction: 'Reply in clear, simple standard English.',
    textbookIntro: "Here is what your textbook says:",
    ttsLang: 'en-NG',
    ttsRate: 1.0,
  },
  pidgin: {
    label: 'Nigerian Pidgin',
    short: 'Pidgin',
    flag: '🇳🇬',
    instruction:
      'Reply in Nigerian Pidgin English, the way a friendly teacher in Lagos would talk. ' +
      'Keep technical words (e.g. "photosynthesis", "acceleration") in English, then explain them in Pidgin with everyday Nigerian examples.',
    textbookIntro: 'Make we check wetin your book talk:',
    ttsLang: 'en-NG',
    ttsRate: 0.92,
  },
  yoruba: {
    label: 'Yoruba + English',
    short: 'Yorùbá mix',
    flag: '🇳🇬',
    instruction:
      'Reply mainly in simple English, but code-switch naturally into Yoruba for greetings, encouragement and everyday analogies ' +
      '(as Lagos and Ibadan teachers do). Keep all technical terms in English.',
    textbookIntro: 'Ẹ jẹ́ ká wo ohun tí ìwé yín sọ (let us see what your book says):',
    ttsLang: 'yo-NG',
    ttsRate: 0.9,
  },
  hausa: {
    label: 'Hausa + English',
    short: 'Hausa mix',
    flag: '🇳🇬',
    instruction:
      'Reply mainly in simple English, but code-switch naturally into Hausa for greetings, encouragement and everyday analogies ' +
      '(as teachers in Kano and Kaduna do). Keep all technical terms in English.',
    textbookIntro: 'Bari mu duba abin da littafinka ya ce (let us see what your book says):',
    ttsLang: 'ha-NG',
    ttsRate: 0.9,
  },
  igbo: {
    label: 'Igbo + English',
    short: 'Igbo mix',
    flag: '🇳🇬',
    instruction:
      'Reply mainly in simple English, but code-switch naturally into Igbo for greetings, encouragement and everyday analogies ' +
      '(as teachers in Enugu and Onitsha do). Keep all technical terms in English.',
    textbookIntro: 'Ka anyị lee ihe akwụkwọ gị kwuru (let us see what your book says):',
    ttsLang: 'ig-NG',
    ttsRate: 0.9,
  },
};

export const TIERS = {
  foundation: 'The student is struggling. Use very short sentences, one idea at a time, one simple worked example, and no jargon without explaining it.',
  standard: 'Explain at secondary-school (WAEC/NECO) level with one worked example.',
  advanced: 'The student is doing well. Be concise, add one exam-style challenge question at the end.',
};

export function isDialect(d) {
  return Object.prototype.hasOwnProperty.call(DIALECTS, d);
}

const MAX_HISTORY_TURNS = 4;
const MAX_PASSAGE_CHARS = 2400;

/**
 * Build chat messages for any engine (WebLLM / Ollama both take OpenAI-style messages).
 * @param {object} p
 * @param {string} p.question
 * @param {Array<{subject:string,topic:string,text:string}>} p.passages  retrieved textbook chunks
 * @param {string} p.dialect   key of DIALECTS
 * @param {string} p.tier      key of TIERS
 * @param {string[]} p.weakTopics topics the student keeps missing in quizzes
 * @param {Array<{role:string,content:string}>} p.history previous turns (oldest first)
 */
export function buildMessages({ question, passages = [], dialect = 'english', tier = 'standard', weakTopics = [], history = [] }) {
  const d = DIALECTS[dialect] || DIALECTS.english;
  const system = [
    'You are EduMesh, a patient secondary-school tutor for Nigerian students preparing for WAEC, NECO and JAMB.',
    d.instruction,
    TIERS[tier] || TIERS.standard,
    'Use Nigerian everyday examples (markets, naira, danfo, farming, local foods) instead of foreign ones.',
    'Base your answer on the TEXTBOOK passages provided. If they do not cover the question, say so briefly and give only what you are sure of.',
    'Keep the answer under 150 words. Do not use markdown tables.',
  ];
  if (weakTopics.length) {
    system.push(`Note: this student has low quiz scores in: ${weakTopics.slice(0, 3).join(', ')}. Be extra clear on these.`);
  }

  let context = '';
  for (const p of passages) {
    const block = `[${p.subject} — ${p.topic}]\n${p.text}\n\n`;
    if (context.length + block.length > MAX_PASSAGE_CHARS) break;
    context += block;
  }

  const user = context
    ? `TEXTBOOK:\n${context.trim()}\n\nQUESTION: ${question}`
    : `QUESTION: ${question}\n(No textbook passage matched this question.)`;

  const trimmedHistory = history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY_TURNS * 2);

  return [{ role: 'system', content: system.join(' ') }, ...trimmedHistory, { role: 'user', content: user }];
}
