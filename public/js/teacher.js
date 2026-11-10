// Teacher pack builder: turns a simple form into a validated lesson pack
// that can be shared phone-to-phone (Xender, Bluetooth, WhatsApp) with no data.
import { makePack } from './packs.js';
import { slug } from './rag.js';

const clean = (s) => String(s ?? '').trim();

/**
 * @param {object} f
 * @param {string} f.title   pack title shown to students
 * @param {string} f.subject e.g. "Biology"
 * @param {string} f.topic   e.g. "Photosynthesis"
 * @param {string} [f.level] e.g. "SS1"
 * @param {string} [f.lesson] lesson text (paragraphs separated by blank lines)
 * @param {Array<{q:string, options:string[], answer:number, explain?:string}>} [f.questions]
 */
export function buildTeacherPack(f, now = Date.now()) {
  const title = clean(f.title);
  const subject = clean(f.subject);
  const topic = clean(f.topic);
  const level = clean(f.level);
  // Stop lesson lines from being read as new headings.
  const lesson = clean(f.lesson).replace(/^#+\s*/gm, '');
  if (!title) throw new Error('Give the pack a title.');
  if (!subject) throw new Error('Enter the subject.');
  if (!topic) throw new Error('Enter the topic.');

  const quizzes = (f.questions || [])
    .filter((q) => clean(q.q))
    .map((q, i) => {
      const options = (q.options || []).map(clean);
      if (options.length < 2 || options.some((o) => !o)) throw new Error(`Question ${i + 1}: fill in every option.`);
      const answer = Number(q.answer);
      if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) throw new Error(`Question ${i + 1}: choose the correct answer.`);
      return {
        subject,
        topic,
        q: clean(q.q),
        options,
        answer,
        explain: clean(q.explain) || `The correct answer is ${'ABCD'[answer]}: ${options[answer]}.`,
      };
    });

  if (!lesson && !quizzes.length) throw new Error('Add lesson text or at least one question.');

  const curriculum = lesson
    ? [{ name: `${slug(topic) || 'lesson'}.md`, markdown: `# ${subject}\n\n## ${topic}\n${level ? `Level: ${level}\n` : ''}\n${lesson}\n` }]
    : [];
  const base = slug(title).slice(0, 40).replace(/-$/, '') || 'pack';
  const id = `${base}-${now.toString(36)}`;
  return makePack({ id, title, curriculum, quizzes });
}

/** File for sharing. Chrome on Android only shares some file types, so we share as plain text. */
export function packFile(pack) {
  return new File([JSON.stringify(pack, null, 1)], `${pack.id}.edumesh.txt`, { type: 'text/plain' });
}
