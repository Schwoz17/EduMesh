// Merges content packs into one graph and exposes language helpers (fallback: requested language -> English).
(function (root) {
  const dep = (n, g) => (typeof require !== 'undefined' ? require(n) : root[g]);
  const C = dep('./content', 'RootPathContent'), A = dep('./algebra', 'RootPathAlgebra'), Ph = dep('./physics', 'RootPathPhysics'), En = dep('./english', 'RootPathEnglish');
  const P = dep('./pcm', 'RootPathPcm'), X = dep('./langs', 'RootPathLangs'), E = dep('./engine', 'RootPathEngine');
  const packs = [C, A, Ph, En];
  const skills = packs.flatMap((p) => p.skills), bank = packs.flatMap((p) => p.bank);
  const misconceptions = Object.assign({}, ...packs.map((p) => p.misconceptions));
  const graph = E.makeGraph(skills);
  const EN = Object.assign(Object.fromEntries(Object.entries(P.lesson).map(([k, v]) => [k, v[0]])), Ph.lessons, En.lessons);
  const subjects = [
    { id: 'maths', label: 'Maths', targets: ['addu', 'multf', 'word', 'solve2', 'leqf'] },
    { id: 'physics', label: 'Physics', targets: ['speed', 'work', 'spdf'] },
    { id: 'english', label: 'English', targets: ['subv', 'tense', 'cond'] },
  ];
  const languages = [{ code: 'en', label: 'English', status: 'reviewed' }, { code: 'pcm', label: 'Pidgin', status: 'draft' }, ...Object.entries(X).map(([code, v]) => ({ code, label: v.label, status: v.status }))];
  const text = {
    skillName: (id, l) => (l === 'pcm' ? P.name[id] : X[l] && X[l].name[id]) || graph.by[id].name,
    misName: (m) => misconceptions[m][0],
    fix: (m, l) => (l === 'pcm' && P.fix[m]) || misconceptions[m][1],
    qText: (q, l) => (l === 'pcm' && P.q[q.id]) || q.q,
    lesson: (id, l) => (l === 'pcm' ? P.lesson[id] && P.lesson[id][1] : X[l] && X[l].lesson[id]) || EN[id],
  };
  // Share of skills/fixes that are really translated (the rest fall back to English).
  const coverage = (l) => ({
    names: skills.filter((s) => (l === 'pcm' ? P.name[s.id] : X[l].name[s.id])).length / skills.length,
    lessons: skills.filter((s) => (l === 'pcm' ? P.lesson[s.id] : X[l].lesson[s.id])).length / skills.length,
    fixes: l === 'pcm' ? Object.keys(misconceptions).filter((m) => P.fix[m]).length / Object.keys(misconceptions).length : 0,
  });
  const ui = (l) => (X[l] ? X[l].ui : null);
  const pack = { skills, misconceptions, bank, graph, text, languages, coverage, ui, subjects, targets: subjects[0].targets };
  if (typeof module !== 'undefined' && module.exports) module.exports = pack; else root.RootPathPack = pack;
})(typeof self !== 'undefined' ? self : this);
