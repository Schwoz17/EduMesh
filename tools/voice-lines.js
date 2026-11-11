#!/usr/bin/env node
// Lists every piece RootPath speaks, for native-speaker review and YarnGPT recording.
//   node tools/voice-lines.js          -> voice/manifest.json + voice/review.csv   (the demo call: what judges hear)
//   node tools/voice-lines.js --full   -> voice/manifest-full.json + voice/review-full.csv (everything)
const fs = require('fs');
const path = require('path');
const P = require('../src/pack');
const { CallSession, CheckInCall, SAY, speakable } = require('../src/call');
const { VOICES, clipId } = require('../src/voice');

const full = process.argv.includes('--full');
const out = new Map(); // id -> entry
const add = (lang, text, where) => {
  if (!text || !String(text).trim()) return;
  const id = clipId(lang, text);
  if (!out.has(id)) out.set(id, { id, lang, yarn_lang: VOICES[lang].lang, speaker: VOICES[lang].speaker, text: String(text).replace(/\s+/g, ' ').trim(), where });
};
const addPrompt = (p, where) => p.segments.forEach((s) => add(p.lang, s, where));

// Tunde's demo call: weak on equivalent fractions and everything above it.
function demoCall(langKey) {
  const s = new CallSession({ caller: 'Tunde' });
  addPrompt(s.start(), 'call: welcome');
  let p = s.press(String(langKey));
  addPrompt(p, 'call: subject');
  p = s.press('1'); addPrompt(p, 'call: topic');
  p = s.press('5'); addPrompt(p, 'call: questions');
  for (let guard = 0; !p.end && guard < 60; guard++) {
    const n = s.D.next(), o = n.question.o;
    // Every possible reply to this question (right, or each mistake explained).
    o.forEach((x) => {
      if (x[1]) add(p.lang, SAY[p.lang]?.right || SAY.en.right, 'call: feedback');
      else { add(p.lang, SAY[p.lang]?.wrong || SAY.en.wrong, 'call: feedback'); if (x[2]) add(p.lang, speakable(P.text.fix(x[2], p.lang)), 'call: mistake explained'); }
    });
    const weak = n.skill === 'equiv' || P.graph.below[n.skill].has('equiv');
    const k = weak ? Math.max(0, o.findIndex((x) => !x[1] && x[2])) : o.findIndex((x) => x[1]);
    p = s.press(String(k + 1));
    addPrompt(p, p.end ? 'call: result' : 'call: questions');
  }
  add(p.lang, SAY[p.lang]?.invalid || SAY.en.invalid, 'call: invalid key');
  // Saturday check-in call on the root skill.
  const c = new CheckInCall({ lang: p.lang, name: 'Tunde', skill: 'equiv', p0: 0.3 });
  let q = c.start(); addPrompt(q, 'check-in call');
  while (!q.end) { q = c.press(String(c.q.o.findIndex((x) => x[1]) + 1)); addPrompt(q, 'check-in call'); }
}

[1, 2].forEach(demoCall); // English, Pidgin
['yo', 'ig', 'ha'].forEach((l) => add(l, SAY[l].hi, 'call: greeting'));

if (full) {
  for (const L of ['en', 'pcm']) {
    const S = { ...SAY.en, ...SAY[L] };
    Object.entries(S).forEach(([k, v]) => { if (!/\{/.test(v)) add(L, v, 'template: ' + k); });
    for (let n = 1; n <= 20; n++) add(L, S.q.replace('{n}', n), 'question number');
    P.subjects.forEach((sub) => sub.targets.forEach((t, i) => add(L, S.opt.replace('{k}', i + 1).replace('{o}', P.text.skillName(t, L)), 'topic menu')));
    P.bank.forEach((q) => {
      add(L, speakable(P.text.qText(q, L)), 'question ' + q.id);
      q.o.forEach((o, i) => { add(L, S.opt.replace('{k}', i + 1).replace('{o}', speakable(o[0])), 'option'); if (o[2]) add(L, speakable(P.text.fix(o[2], L)), 'mistake explained'); });
    });
    P.skills.forEach((sk) => add(L, S.lesson.replace('{lesson}', P.text.lesson(sk.id, L)), 'lesson ' + sk.id));
  }
}

const rows = [...out.values()];
const dir = path.join(__dirname, '..', 'voice');
fs.mkdirSync(dir, { recursive: true });
const suffix = full ? '-full' : '';
fs.writeFileSync(path.join(dir, `manifest${suffix}.json`), JSON.stringify(rows, null, 1) + '\n');
const csv = (s) => '"' + String(s).replace(/"/g, '""') + '"';
const LANG = { en: 'English', pcm: 'Pidgin', yo: 'Yoruba', ig: 'Igbo', ha: 'Hausa' };
fs.writeFileSync(path.join(dir, `review${suffix}.csv`), '﻿' + [['language', 'where it is said', 'what RootPath says now', 'your correction (leave blank if fine)', 'comment', 'id'].map(csv).join(','),
  ...rows.map((r) => [LANG[r.lang], r.where, r.text, '', '', r.id].map(csv).join(','))].join('\r\n') + '\r\n');
const byLang = rows.reduce((m, r) => ((m[r.lang] = (m[r.lang] || 0) + 1), m), {});
console.log(`${rows.length} spoken pieces (${Object.entries(byLang).map(([k, v]) => `${LANG[k]} ${v}`).join(', ')}) -> voice/manifest${suffix}.json, voice/review${suffix}.csv`);

// Translation sheet: the call's fixed lines, for native speakers of Yoruba, Igbo and Hausa to fill in.
// Keep {name}, {skill}, {roots}, {path}, {topic}, {n}, {k}, {o}, {a}, {b}, {lesson} exactly as they are.
const tr = [['key', 'English (what to translate)', 'Pidgin (current draft: please correct)', 'Yoruba', 'Igbo', 'Hausa', 'comment'].map(csv).join(',')];
Object.keys(SAY.en).forEach((k) => tr.push([k, SAY.en[k], SAY.pcm[k] || '', SAY.yo[k] || '', SAY.ig[k] || '', SAY.ha[k] || '', ''].map(csv).join(',')));
fs.writeFileSync(path.join(dir, 'translate.csv'), '﻿' + tr.join('\r\n') + '\r\n');
console.log(`${Object.keys(SAY.en).length} call lines -> voice/translate.csv (for Yoruba, Igbo, Hausa translators)`);
