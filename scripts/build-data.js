#!/usr/bin/env node
// Builds public/data/curriculum.json and public/data/quizzes.json from curriculum/.
// Run after editing curriculum files:  npm run build:data
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chunkMarkdown } from '../public/js/rag.js';
import { validateQuizzes } from '../public/js/packs.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'curriculum');
const out = join(root, 'public', 'data');
mkdirSync(out, { recursive: true });

const chunks = [];
for (const file of readdirSync(src).filter((f) => /\.(md|txt)$/.test(f)).sort()) {
  const subject = basename(file).replace(/\.\w+$/, '').replace(/^\w/, (c) => c.toUpperCase());
  chunks.push(...chunkMarkdown(readFileSync(join(src, file), 'utf8'), subject));
}

const quizzes = JSON.parse(readFileSync(join(src, 'quizzes.json'), 'utf8'));
validateQuizzes(quizzes);

const version = new Date().toISOString().slice(0, 10);
writeFileSync(join(out, 'curriculum.json'), JSON.stringify({ version, chunks }));
writeFileSync(join(out, 'quizzes.json'), JSON.stringify({ version, questions: quizzes }));

const subjects = [...new Set(chunks.map((c) => c.subject))];
console.log(`Built ${chunks.length} chunks across ${subjects.length} subjects (${subjects.join(', ')}) and ${quizzes.length} quiz questions.`);
