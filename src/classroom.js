// Classroom view: turns many learners' results into "teach at the right level" groups.
// Input rows come from calls in the demo, from SMS progress codes, or from a simulated class.
(function (root) {
  const dep = (n, g) => (typeof require !== 'undefined' ? require(n) : root[g]);
  const P0 = dep('./pack', 'RootPathPack');
  const { simulate } = dep('./engine', 'RootPathEngine');
  const { smsDecode } = dep('./router', 'RootPathRouter');

  /**
   * rows: [{ name, target, roots: [skillId], simulated? }]
   * Returns groups by root gap (largest first, earliest skill first on ties) and the no-gap learners.
   */
  function groupByRoot(rows, pack = P0) {
    const map = new Map();
    const noGap = [];
    for (const r of rows) {
      if (!r.roots || !r.roots.length) { noGap.push(r.name); continue; }
      const key = r.roots[0]; // earliest root decides the group; extra roots are listed
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r.name);
    }
    const groups = [...map.entries()]
      .map(([skill, names]) => ({ skill, name: pack.text.skillName(skill, 'en'), level: pack.graph.by[skill].lvl, names, count: names.length }))
      .sort((a, b) => b.count - a.count || a.level - b.level);
    return { total: rows.length, groups, noGap };
  }

  /** Rebuild a learner from an RP1 progress code: weak skills whose prerequisites are strong are roots. */
  function fromCode(name, code, pack = P0) {
    const m = smsDecode(code);
    const known = Object.keys(m).filter((k) => pack.graph.by[k]);
    const weak = (k) => m[k] != null && m[k] < 0.5;
    const roots = known.filter((k) => weak(k) && pack.graph.by[k].pre.every((p) => m[p] == null || !weak(p)));
    roots.sort((a, b) => pack.graph.by[a].lvl - pack.graph.by[b].lvl);
    return { name, roots, mastery: m, fromCode: true };
  }

  // Small deterministic random generator, so the demo class is the same every time.
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  const NAMES = ['Ifeoma', 'Amaka', 'Musa', 'Chiamaka', 'Bola', 'Ifeanyi', 'Zainab', 'Emeka', 'Aisha', 'Segun', 'Ngozi', 'Ibrahim', 'Funke', 'Chidi', 'Halima', 'Kunle', 'Ada', 'Yusuf', 'Bisi', 'Obinna', 'Fatima', 'Dayo', 'Uche', 'Hauwa', 'Tolu', 'Nkechi', 'Sani', 'Kemi', 'Eze', 'Rukayat'];

  /** A simulated JSS1 class (clearly labelled as simulated in the UI), diagnosed by the real engine. */
  function demoClass({ size = 30, target = 'leqf', seed = 7, pack = P0 } = {}) {
    const r = rng(seed), below = [...pack.graph.below[target]];
    // Typical spread: most gaps sit in a few foundation skills.
    const common = ['equiv', 'lcm', 'frac', 'ints', 'solve1', 'mult', 'div'].filter((s) => below.includes(s));
    return NAMES.slice(0, size).map((name) => {
      const x = r();
      const gaps = x < 0.15 ? [] : [x < 0.85 ? common[Math.floor(r() * Math.min(4, common.length))] : below[Math.floor(r() * below.length)]];
      const d = simulate(target, gaps, pack.graph, pack.bank);
      return { name, target, roots: d.roots(), questions: d.asked.length, simulated: true };
    });
  }

  const api = { groupByRoot, fromCode, demoClass };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RootPathClass = api;
})(typeof self !== 'undefined' ? self : this);
