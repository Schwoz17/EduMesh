// Curriculum update packs: small JSON files a teacher can pass phone-to-phone
// (Xender/ShareIt/Bluetooth/USB) and import with zero data. Validated before use.
import { chunkMarkdown } from './rag.js';

export const PACK_FORMAT = 'edumesh-pack';
const MAX_PACK_BYTES = 2_000_000;

export function validateQuizzes(questions) {
  if (!Array.isArray(questions)) throw new Error('quizzes must be an array');
  questions.forEach((q, i) => {
    const where = `quiz #${i + 1}`;
    for (const f of ['subject', 'topic', 'q', 'explain']) {
      if (typeof q[f] !== 'string' || !q[f].trim()) throw new Error(`${where}: missing "${f}"`);
    }
    if (!Array.isArray(q.options) || q.options.length < 2 || !q.options.every((o) => typeof o === 'string')) {
      throw new Error(`${where}: needs at least 2 text options`);
    }
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) throw new Error(`${where}: bad answer index`);
  });
  return true;
}

/** Parse + validate a pack from raw text. Returns the pack object or throws a readable Error. */
export function parsePack(text) {
  if (typeof text !== 'string' || text.length > MAX_PACK_BYTES) throw new Error('Pack file is too large (max 2 MB).');
  let pack;
  try {
    pack = JSON.parse(text);
  } catch {
    throw new Error('This is not a valid EduMesh pack (not JSON).');
  }
  if (!pack || pack.format !== PACK_FORMAT) throw new Error('This is not an EduMesh pack (wrong format).');
  if (typeof pack.id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(pack.id)) throw new Error('Pack id is missing or invalid.');
  if (typeof pack.title !== 'string' || !pack.title.trim()) throw new Error('Pack title is missing.');
  const curriculum = pack.curriculum || [];
  if (!Array.isArray(curriculum)) throw new Error('Pack curriculum must be a list.');
  for (const doc of curriculum) {
    if (!doc || typeof doc.markdown !== 'string') throw new Error('Each curriculum entry needs markdown text.');
  }
  validateQuizzes(pack.quizzes || []);
  if (!curriculum.length && !(pack.quizzes || []).length) throw new Error('Pack is empty.');
  return { ...pack, curriculum, quizzes: pack.quizzes || [] };
}

/** Turn a pack's markdown into retrievable chunks (ids prefixed so they never clash with built-ins). */
export function packChunks(pack) {
  return pack.curriculum.flatMap((doc) =>
    chunkMarkdown(doc.markdown, doc.subject || 'General').map((c) => ({ ...c, id: `pack:${pack.id}:${c.id}`, pack: pack.id }))
  );
}

export function makePack({ id, title, curriculum = [], quizzes = [] }) {
  const pack = { format: PACK_FORMAT, version: 1, id, title, created: new Date().toISOString(), curriculum, quizzes };
  return parsePack(JSON.stringify(pack));
}
