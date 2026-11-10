// Local retrieval (the "R" in RAG), implemented as BM25 keyword search.
// Runs entirely in the browser (or Node, for the build script and tests),
// so textbook search works on any phone with no model and no network.

const STOPWORDS = new Set(
  ('a an and are as at be been but by can could did do does for from had has have how i if in into is it its ' +
    'me my no not of on or our so such than that the their them then there these they this to too was we were ' +
    'what when where which who why will with would you your about explain tell please define meaning mean ' +
    'abeg wetin dey una make na')
    .split(/\s+/)
);

export function stem(word) {
  if (word.length <= 3) return word;
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
  if (word.endsWith('sses')) return word.slice(0, -2);
  if (word.endsWith('ing') && word.length > 5) return word.slice(0, -3);
  if (word.endsWith('ed') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('s') && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
  return word;
}

export function tokenize(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics (Yoruba/Igbo tone marks)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    .map(stem);
}

const MAX_WORDS_PER_CHUNK = 140;

/**
 * Split a curriculum markdown file into retrievable chunks.
 * Format: "# Subject" heading, then "## Topic" sections, optional "Level: ..." line.
 */
export function chunkMarkdown(markdown, fallbackSubject = 'General') {
  const lines = String(markdown).replace(/\r\n/g, '\n').split('\n');
  let subject = fallbackSubject;
  const sections = [];
  let current = null;
  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    if (h1 && !h2) {
      subject = h1[1].trim();
      continue;
    }
    if (h2) {
      current = { subject, topic: h2[1].trim(), level: '', paragraphs: [] };
      sections.push(current);
      continue;
    }
    if (!current) continue;
    const level = line.match(/^Level:\s*(.+)/i);
    if (level) {
      current.level = level[1].trim();
      continue;
    }
    if (line.trim()) current.paragraphs.push(line.trim());
  }

  const chunks = [];
  for (const s of sections) {
    let buf = [];
    let words = 0;
    let part = 0;
    const flush = () => {
      if (!buf.length) return;
      chunks.push({
        id: `${slug(s.subject)}/${slug(s.topic)}#${part++}`,
        subject: s.subject,
        topic: s.topic,
        level: s.level,
        text: buf.join('\n\n'),
      });
      buf = [];
      words = 0;
    };
    for (const p of s.paragraphs) {
      const n = p.split(/\s+/).length;
      if (words + n > MAX_WORDS_PER_CHUNK && buf.length) flush();
      buf.push(p);
      words += n;
    }
    flush();
  }
  return chunks;
}

export function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Build a BM25 index. Topic titles are weighted by repeating their tokens. */
export function buildIndex(chunks) {
  const docs = chunks.map((c) => {
    const tokens = [...tokenize(c.topic), ...tokenize(c.topic), ...tokenize(c.subject), ...tokenize(c.text)];
    const tf = new Map();
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
    return { chunk: c, tf, len: tokens.length };
  });
  const df = new Map();
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) || 0) + 1);
  const avgdl = docs.reduce((a, d) => a + d.len, 0) / Math.max(docs.length, 1);
  return { docs, df, avgdl, N: docs.length };
}

/**
 * BM25 search. Returns [{ ...chunk, score }] sorted by score, best first.
 * options.subject restricts results to one subject ("all" or empty = any).
 */
export function search(index, query, { k = 3, subject = '' } = {}) {
  const qTokens = [...new Set(tokenize(query))];
  if (!qTokens.length || !index.N) return [];
  const k1 = 1.4;
  const b = 0.75;
  const results = [];
  for (const d of index.docs) {
    if (subject && subject !== 'all' && slug(d.chunk.subject) !== slug(subject)) continue;
    let score = 0;
    for (const t of qTokens) {
      const f = d.tf.get(t);
      if (!f) continue;
      const n = index.df.get(t) || 0;
      const idf = Math.log(1 + (index.N - n + 0.5) / (n + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / index.avgdl)));
    }
    if (score > 0) results.push({ ...d.chunk, score });
  }
  results.sort((a, b2) => b2.score - a.score);
  return results.slice(0, k);
}

/**
 * Pick the sentences from the retrieved passages that best match the question.
 * Used by Textbook Mode (no AI model) and as a fallback when a model fails.
 */
export function extractiveAnswer(query, passages, maxSentences = 4) {
  const q = new Set(tokenize(query));
  const candidates = [];
  passages = passages.map((p, i) => ({ id: String(i), ...p }));
  passages.forEach((p, pi) => {
    const sentences = p.text.replace(/\n+/g, ' ').match(/[^.!?]+[.!?]+(\s|$)/g) || [p.text];
    sentences.forEach((s, si) => {
      const toks = tokenize(s);
      const overlap = toks.filter((t) => q.has(t)).length;
      // Prefer: overlap with the question, the best passage, and early (definitional) sentences.
      const score = overlap * 2 + (pi === 0 ? 1.5 : 0) + (si === 0 ? 1 : 0) - si * 0.05;
      candidates.push({ s: s.trim(), score, pi, si });
    });
  });
  const picked = candidates
    .filter((c) => c.score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    // Re-order into textbook reading order so the answer flows naturally.
    .sort((a, b) => passages[a.pi].id.localeCompare(passages[b.pi].id, 'en', { numeric: true }) || a.si - b.si);
  return picked.map((c) => c.s).join(' ');
}
