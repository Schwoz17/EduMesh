# RootPath
Offline root-cause tutor. `npm test` (Node 18+, no dependencies) runs 47 tests.

**Live:** https://edumesh-eta.vercel.app/ (open once, then it works in airplane mode; installable as an app). Or open `index.html` directly.
- `src/content.js`, `src/algebra.js`, `src/physics.js`, `src/english.js`: three subjects, 26 skills, 78 questions, 33 misconceptions. Physics links to maths (speed needs division; speed with fractions needs fraction-of-a-quantity).
- `src/pcm.js`: Nigerian Pidgin strings and mini-lessons (draft, needs native review)
- `src/langs.js`: Yoruba, Igbo, Hausa: full UI, all 16 skill names, 6 core lessons each (draft). Everything else falls back to English; `coverage(lang)` reports the gap.
- `src/engine.js`: BKT, root-cause search, path builder, practice rounds, student simulator
- `src/ussd.js`: stateless USSD channel; `src/router.js`: review gate, answer routing, SMS code, field-test agreement
- `tools/generate_content.js`: AI drafting of Pidgin explanations (needs ANTHROPIC_API_KEY; outputs reviewed:false)
- `tools/report.js` + `field-test/`: evidence report from real-learner sessions
- `PITCH.md`: demo script and judging map
- `sw.js` + `manifest.webmanifest`: offline install from the live link (service worker caches the app on first visit)
- In the app: the result screen shows **How RootPath decided** (per-skill mastery from Bayesian Knowledge Tracing) and a **Teacher check** that saves the teacher's view of the gap with each result. Export with *Download field-test JSON*, then `npm run report -- rootpath-field-test.json` prints agreement and mastery gain.
