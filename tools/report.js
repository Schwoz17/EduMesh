// Usage: node tools/report.js field-test/results.json  (export from the app's "Download field-test JSON")
const { agreement } = require('../src/router');
const rows = JSON.parse(require('fs').readFileSync(process.argv[2] || 'field-test/sample.json', 'utf8'));
const a = agreement(rows);
console.log(`Learners: ${a.total}  Rated by teacher/parent: ${a.rated}  Engine agreed: ${a.matched}` + (a.rate == null ? '' : `  (${Math.round(a.rate * 100)}%)`));
const gain = rows.filter((r) => r.before && r.after).map((r) => Math.max(...r.roots.map((x) => (r.after[x] ?? 0) - (r.before[x] ?? 0))));
if (gain.length) console.log(`Average root-skill mastery gain after practice: +${Math.round((gain.reduce((s, x) => s + x, 0) / gain.length) * 100)} points`);
