#!/usr/bin/env node
// Create a curriculum update pack that students can import offline.
// Usage: node scripts/make-pack.js --id waec-2026-econ --title "Economics basics" lesson.md [more.md] [--quizzes q.json] [-o pack.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { makePack } from '../public/js/packs.js';

const args = process.argv.slice(2);
const opt = { files: [] };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--id') opt.id = args[++i];
  else if (a === '--title') opt.title = args[++i];
  else if (a === '--quizzes') opt.quizzes = args[++i];
  else if (a === '-o' || a === '--out') opt.out = args[++i];
  else opt.files.push(a);
}
if (!opt.id || !opt.title || (!opt.files.length && !opt.quizzes)) {
  console.error('Usage: node scripts/make-pack.js --id <id> --title <title> lesson.md [...] [--quizzes q.json] [-o pack.json]');
  process.exit(1);
}
const curriculum = opt.files.map((f) => ({ name: basename(f), markdown: readFileSync(f, 'utf8') }));
const quizzes = opt.quizzes ? JSON.parse(readFileSync(opt.quizzes, 'utf8')) : [];
const pack = makePack({ id: opt.id, title: opt.title, curriculum, quizzes });
const out = opt.out || `${opt.id}.edumesh.json`;
writeFileSync(out, JSON.stringify(pack, null, 2));
console.log(`Wrote ${out}: ${curriculum.length} lesson file(s), ${quizzes.length} quiz question(s).`);
