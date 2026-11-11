// AI answer routing, review gate for AI-drafted content, SMS progress codes, field-test agreement metric.
(function (root) {
  // Only human-reviewed items may be shown to children.
  const servable = (items) => items.filter((i) => i.reviewed === true);
  // cached content -> on-device model -> cloud (if online) -> queue
  function route(q, { cache = {}, local, cloud, online = false } = {}) {
    if (cache[q.key] != null) return { via: 'cache', answer: cache[q.key] };
    const l = local && local(q); if (l) return { via: 'local', answer: l };
    const c = online && cloud && cloud(q); if (c) return { via: 'cloud', answer: c };
    return { via: 'queue', answer: null };
  }
  const smsEncode = (mastery) => 'RP1 ' + Object.keys(mastery).sort().map((k) => k + ':' + String(Math.round(mastery[k] * 99)).padStart(2, '0')).join(',');
  function smsDecode(s) {
    if (!s.startsWith('RP1 ')) throw new Error('Not a RootPath code');
    return Object.fromEntries(s.slice(4).split(',').filter(Boolean).map((x) => { const [k, v] = x.split(':'); return [k, +v / 99]; }));
  }
  // rows: [{learner, roots:[], teacherRoots:[]|null}] -> how often the engine agrees with the teacher/parent
  function agreement(rows) {
    const rated = rows.filter((r) => Array.isArray(r.teacherRoots));
    const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
    const matched = rated.filter((r) => same(r.roots, r.teacherRoots)).length;
    return { total: rows.length, rated: rated.length, matched, rate: rated.length ? matched / rated.length : null };
  }
  const api = { servable, route, smsEncode, smsDecode, agreement };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RootPathRouter = api;
})(typeof self !== 'undefined' ? self : this);
