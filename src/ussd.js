// Feature-phone channel (stateless, like Africa's Talking: `text` = everything typed, joined by "*").
// Output is folded to plain GSM-safe ASCII: tone marks and Hausa hooked letters (ɓ ɗ ƙ) would force UCS-2 and cut the screen to ~70 chars.
(function (root) {
  const pack = typeof require !== 'undefined' ? require('./pack') : root.RootPathPack;
  const { Diagnosis } = typeof require !== 'undefined' ? require('./engine') : root.RootPathEngine;
  const LANGS = ['en', 'pcm', 'yo', 'ig', 'ha'];
  const MAP = { '×': 'x', '÷': '/', '−': '-', '²': '2', '…': '...', '’': "'", 'ɓ': 'b', 'ɗ': 'd', 'ƙ': 'k', 'Ɓ': 'B', 'Ɗ': 'D', 'Ƙ': 'K' };
  const gsm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[×÷−²…’ɓɗƙƁƊƘ]/g, (c) => MAP[c]);
  const clip = (s) => { s = gsm(s); return s.length > 182 ? s.slice(0, 179) + '...' : s; };
  const END = { en: ['Gap starts at: ', 'No gap found. You know this topic.', 'Path: '], pcm: ['Wahala start for: ', 'No gap. You sabi am!', 'Path: '] };
  function ussd(text, p = pack) {
    const inp = text ? text.split('*') : [], L = LANGS[+inp[0] - 1], T = p.text;
    if (!inp.length) return 'CON RootPath\n1 English\n2 Pidgin\n3 Yoruba\n4 Igbo\n5 Hausa';
    if (!L) return 'END Invalid choice';
    const ui = p.ui(L) || {};
    if (inp.length === 1) return clip('CON ' + (L === 'pcm' ? 'Which subject?' : 'Subject') + '\n' + p.subjects.map((x, i) => `${i + 1} ${x.label}`).join('\n'));
    const S = p.subjects[+inp[1] - 1];
    if (!S) return 'END Invalid choice';
    if (inp.length === 2) return clip('CON ' + (L === 'en' ? 'Pick a topic' : L === 'pcm' ? 'Which one hard you?' : ui.topic) + '\n' + S.targets.map((t, i) => `${i + 1} ${T.skillName(t, L).slice(0, 26)}`).join('\n'));
    const t = S.targets[+inp[2] - 1];
    if (!t) return 'END Invalid choice';
    const d = new Diagnosis(t, p.graph, p.bank);
    for (const a of inp.slice(3)) {
      if (!d.next()) break;
      const i = +a - 1;
      if (!Number.isInteger(i) || i < 0 || i > 3) return 'END Invalid choice';
      d.answer(i);
    }
    const n = d.next();
    if (n) return clip('CON ' + T.qText(n.question, L) + '\n' + n.question.o.map((o, i) => `${i + 1} ${o[0]}`).join('\n'));
    const r = d.result(), nm = (x) => T.skillName(x, L), E = END[L] || [ui.gap + ': ', ui.nogap, ui.path + ': '];
    if (!r.roots.length) return clip('END ' + E[1]);
    return clip('END ' + E[0] + r.roots.map(nm).join(', ') + '\n' + E[2] + r.path.map(nm).join(' > '));
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { ussd, clip, gsm, LANGS }; else root.RootPathUssd = { ussd, clip, gsm, LANGS };
})(typeof self !== 'undefined' ? self : this);
